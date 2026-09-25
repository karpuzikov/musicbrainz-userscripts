// Pre-flight: resolve every Discogs artist / company against MusicBrainz
// BEFORE the actual import runs, so the review-table phase can show one
// row per credit with the chosen MBID (or "needs attention") for the user
// to confirm.
//
// Single resolver: `resolveEntity(entity, kind, opts)` + the pool runner
// `resolveAll(entities, opts)`. `opts.kindOf(entity)` decides
// `'artist' | 'label' | 'place'` per entity (`null` = skip).
//
// ── Lookup strategy per entity ─────────────────────────────────────────────
//   1. IDB cache (`entity_cache` store) — instant; populated by prior runs.
//   2. Name-only artists: search the current release context first:
//       - directly credited release / track / recording artists
//       - aliases of those directly credited artists
//       - artists connected to them by artist↔artist relationships
//       - aliases of those connected artists
//      Stop at the first circle with an exact match; ambiguous circles stay
//      unresolved for review. Only then fall through to the global search.
//   3. Name search + URL relation run **in parallel**:
//       - `/ws/2/<type>?query=…&fmt=json`              (search by name)
//       - `/ws/2/url?resource=<discogsUrl>&inc=<type>-rels`  (URL relation)
//   3. Decide based on what the two parallel lookups produced:
//       - name **and** URL agree (same MBID) → `resolvedVia: 'both'`
//       - URL-only (direct URL relation, strong) → `resolvedVia: 'url'`
//       - name-only (exact-name single match) → `resolvedVia: 'name'`
//       - they disagree → unresolved (user reviews; caught a latent bug
//         where the old code would silently auto-pick one)
//       - neither hit → unresolved
//
// Result shape per entity is one of:
//   { type: 'resolved',  entity, mbUrl, mbName, mbDisambig, logEntry: {...} }
//   { type: 'attention', entity, nameMatches: [...] }

import { mbThrottle }                       from './api-mb.js';
import { readIdbRecord, writeIdbRecord, deleteIdbRecord } from './storage.js';
import { parseSourceEntityUrl, idbKeyForEntity } from './sources/registry.js';
import { ENTITY_TYPE_MAP }                  from './data/entity-map.js';
import { _setProgressPct }                  from './progress-bar.js';
import { logDebug }                         from './log.js';

// `kind`-specific tweaks. Tiny lookup table so the per-strategy code in
// `resolveEntity` reads as one shared body.
const KIND_TABLE = {
    artist: { searchLimit: 10, resultKey: 'artists', incRels: 'artist-rels' },
    label:  { searchLimit: 8,  resultKey: 'labels',  incRels: 'label-rels'  },
    // Places also accept label-rels because MB editors often file a
    // facility as a label rather than a place (issue we've worked around
    // since the original company resolver).
    place:  { searchLimit: 8,  resultKey: 'places',  incRels: 'place-rels+label-rels' },
};


const _releaseArtistContextPromises = new Map();
const _artistContextDetailPromises = new Map();

function normalizeArtistName(value) {
    return String(value || '').trim().toLowerCase();
}

function sameArtistName(left, right) {
    return normalizeArtistName(left) === normalizeArtistName(right);
}

function artistCanonicalNameMatches(name, artist) {
    return [artist?.name, artist?.['sort-name'], artist?.sortName]
        .filter(Boolean)
        .some(value => sameArtistName(name, value));
}

function artistAliasMatches(name, artist) {
    return (artist?.aliases || []).some(alias =>
        sameArtistName(name, typeof alias === 'string' ? alias : alias?.name)
    );
}

function collectReleaseCreditedArtists(release) {
    const artists = new Map();

    function addCredit(credit, scope) {
        for (const entry of (credit || [])) {
            const artist = entry?.artist;
            if (!artist?.id) continue;

            let item = artists.get(artist.id);
            if (!item) {
                item = {
                    ...artist,
                    creditedNames: new Set(),
                    scopes: new Set(),
                };
                artists.set(artist.id, item);
            }

            if (entry?.name) item.creditedNames.add(String(entry.name));
            if (artist.name) item.creditedNames.add(String(artist.name));
            item.scopes.add(scope);
        }
    }

    addCredit(release?.['artist-credit'], 'release');
    for (const medium of (release?.media || [])) {
        for (const track of (medium?.tracks || [])) {
            addCredit(track?.['artist-credit'], 'track');
            addCredit(track?.recording?.['artist-credit'], 'recording');
        }
    }

    return [...artists.values()];
}

async function getArtistContextDetails(mbid) {
    if (!_artistContextDetailPromises.has(mbid)) {
        _artistContextDetailPromises.set(
            mbid,
            mbThrottle.fetchJson(
                `//musicbrainz.org/ws/2/artist/${mbid}?inc=aliases+artist-rels&fmt=json`
            )
        );
    }
    return _artistContextDetailPromises.get(mbid);
}

async function getReleaseArtistContext(releaseMbid) {
    if (!releaseMbid) return null;

    if (!_releaseArtistContextPromises.has(releaseMbid)) {
        _releaseArtistContextPromises.set(releaseMbid, (async () => {
            const release = await mbThrottle.fetchJson(
                `//musicbrainz.org/ws/2/release/${releaseMbid}?inc=artist-credits+recordings&fmt=json`
            );
            if (!release) return null;
            return {
                releaseMbid,
                directArtists: collectReleaseCreditedArtists(release),
            };
        })());
    }

    return _releaseArtistContextPromises.get(releaseMbid);
}

function contextCandidate(artist) {
    return {
        id: artist.id,
        name: artist.name || '',
        disambiguation: artist.disambiguation || artist['disambiguation-comment'] || '',
        score: 100,
    };
}

function dedupeContextCandidates(candidates) {
    return [...new Map(
        candidates.filter(candidate => candidate?.id).map(candidate => [candidate.id, candidate])
    ).values()];
}

async function findContextArtistMatches(searchName, releaseMbid) {
    const context = await getReleaseArtistContext(releaseMbid);
    if (!context?.directArtists?.length) return { circle: 0, matches: [] };

    // Circle 1: artists directly credited on this release / track / recording.
    const circle1 = dedupeContextCandidates(
        context.directArtists
            .filter(artist =>
                artistCanonicalNameMatches(searchName, artist) ||
                [...(artist.creditedNames || [])].some(name => sameArtistName(searchName, name))
            )
            .map(contextCandidate)
    );
    if (circle1.length) return { circle: 1, matches: circle1 };

    // Fetch each directly credited artist once. These same responses also carry
    // the artist↔artist relationships needed by circles 3 and 4.
    const directDetails = (await Promise.all(
        context.directArtists.map(artist => getArtistContextDetails(artist.id))
    )).filter(Boolean);

    // Circle 2: aliases of directly credited artists.
    const circle2 = dedupeContextCandidates(
        directDetails
            .filter(artist => artistAliasMatches(searchName, artist))
            .map(contextCandidate)
    );
    if (circle2.length) return { circle: 2, matches: circle2 };

    const relatedContexts = [];
    for (const root of directDetails) {
        for (const relation of (root.relations || [])) {
            const related = relation?.artist;
            if (!related?.id) continue;
            relatedContexts.push({ root, relation, related });
        }
    }

    // Circle 3: artists connected to a directly credited artist. Relationship
    // source/target credits count as names for the related artist too.
    const circle3 = dedupeContextCandidates(
        relatedContexts
            .filter(({ relation, related }) => {
                const relationshipCredits = [
                    relation?.['source-credit'],
                    relation?.['target-credit'],
                ].filter(Boolean);
                return artistCanonicalNameMatches(searchName, related) ||
                    relationshipCredits.some(value => sameArtistName(searchName, value));
            })
            .map(({ related }) => contextCandidate(related))
    );
    if (circle3.length) return { circle: 3, matches: circle3 };

    // Circle 4: aliases of connected artists. Avoid fetching every artist in a
    // large relationship neighbourhood: ask the alias index once, restrict the
    // hits to related MBIDs, then verify the exact alias on only those hits.
    const relatedIds = new Set(relatedContexts.map(({ related }) => related.id));
    if (relatedIds.size) {
        const escaped = String(searchName || '')
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
        const aliasJson = await mbThrottle.fetchJson(
            `//musicbrainz.org/ws/2/artist?query=${encodeURIComponent(`alias:"${escaped}"`)}&fmt=json&limit=25`
        );
        const relatedHits = (aliasJson?.artists || []).filter(artist => relatedIds.has(artist.id));
        const verified = (await Promise.all(
            relatedHits.map(artist => getArtistContextDetails(artist.id))
        )).filter(artist => artist && artistAliasMatches(searchName, artist));
        const circle4 = dedupeContextCandidates(verified.map(contextCandidate));
        if (circle4.length) return { circle: 4, matches: circle4 };
    }

    return { circle: 0, matches: [] };
}

/**
 * Resolve a single Discogs entity against MB using the 3-strategy chain.
 *
 *   - `kind`: one of `'artist' | 'label' | 'place'`.
 *   - `opts.bypassIdb`: skip step 1 (for forced refreshes).
 *
 * Returns one of the result shapes documented at the top of the file.
 */
async function resolveEntity(entity, kind, opts) {
    const { bypassIdb, releaseMbid } = opts;
    const { searchLimit, resultKey, incRels } = KIND_TABLE[kind];

    const parsed     = parseSourceEntityUrl(entity.resource_url);
    // Name-only entities (Qobuz, #271 derived remixers) have no source URL but
    // may carry a release-scoped `_cacheKey` so their resolution still persists.
    const key        = parsed?.key || entity._cacheKey || null;
    const searchName = entity.name;
    const displayName = kind === 'artist'
        ? (entity.anv && entity.anv.trim()) || entity.name
        : entity.name;
    // API URLs ("api.discogs.com/artists/123") → website form ("www.discogs.com/artist/123").
    // Same `(\w+?)s/(\d+)` pattern works for artist/label/master.
    const discogsHref = entity.resource_url
        .replace(/https:\/\/api\.discogs\.com\/(\w+?)s\/(\d+)/, 'https://www.discogs.com/$1/$2');

    function buildResolved(mbUrl, mbName, mbDisambig, via, actualKind = kind, fromCache = false, urlLinkedIds, creditOverride) {
        return {
            type: 'resolved', entityType: actualKind, entity,
            displayName, discogsHref, mbUrl, mbName, mbDisambig,
            // User's saved "Credited as" override from a prior session
            // (IDB `creditOverride` field). Review-table reads this in
            // `pickPrefill` to populate the field. Undefined when no
            // prior override exists. #105.
            creditOverride,
            // `urlLinkedIds` — MBIDs that have a relation to this Discogs URL,
            //                  harvested from the URL lookup done during
            //                  preflight. The review-table uses this to render
            //                  the "Add Discogs link" / "already linked" / "linked
            //                  to different MB <type>" badge without issuing
            //                  another `/ws/2/url?…` query per row. `undefined`
            //                  means "preflight didn't ask MB" (IDB hit on a
            //                  legacy record that predates this field), in which
            //                  case review-table falls back to its own per-row
            //                  fetch. `[]` means "asked MB, got no relations" —
            //                  no fallback needed.
            urlLinkedIds,
            // `via`      — the resolution mechanism (`name` / `url` / `both` / `user`,
            //              or `cache` only when a legacy IDB record predates the
            //              `resolvedVia` field and we genuinely can't recover it).
            // `fromCache`— whether THIS resolution came from IDB rather than a fresh
            //              MB lookup. The two are orthogonal: a name-resolved entity
            //              loaded from cache is `via='name'` + `fromCache=true`, and
            //              the UI surfaces both as `name (cache)`.
            logEntry: { displayName, discogsHref, mbUrl, mbName, mbDisambig, via, fromCache },
        };
    }

    function buildAttention(nameMatches, nameSearchFailed, ambiguityReason, urlLinkedIds, creditOverride) {
        return {
            type: 'attention', entityType: kind, entity,
            displayName, discogsHref, nameMatches: nameMatches || [],
            // Saved "Credited as" override — see buildResolved. #105.
            creditOverride,
            // Same `urlLinkedIds` contract as on the resolved shape — review-table
            // uses it to skip the per-row URL fetch even for attention rows once
            // the user picks an MBID from the candidate list.
            urlLinkedIds,
            // Only artists track this — used by the review table to badge
            // entries that failed because of a rate-limited name search vs
            // entries that genuinely don't exist in MB.
            rateLimited: kind === 'artist' && nameSearchFailed && !(nameMatches?.length),
            ambiguityReason: ambiguityReason || null,
        };
    }

    /** Fetch MB entity name/disambiguation for a known MB type+MBID (display only). */
    async function fetchMbEntityInfo(et, mbid) {
        const json = await mbThrottle.fetchJson(`//musicbrainz.org/ws/2/${et}/${mbid}?fmt=json`);
        return json
            ? { name: json.name || null, disambiguation: json.disambiguation || '' }
            : { name: null, disambiguation: '' };
    }

    // ── 1. IDB cache ─────────────────────────────────────────────────────────
    // Refresh-from-MB: wipe the existing record up-front so this entity
    // genuinely starts from scratch. Earlier we only skipped the read
    // and let the post-resolution write overwrite — but the write path
    // can land on "attention" (no single match / disagreement) and
    // silently overwrite a previously-resolved MBID with `mbid: null`.
    // That made refresh quietly destructive on flaky MB days. Wiping
    // first means the worst-case outcome is "no cache entry", not
    // "cache entry downgraded".
    if (bypassIdb && key) {
        await deleteIdbRecord(key);
    }
    if (!bypassIdb && key) {
        const cachedRec = await readIdbRecord(key);
        if (cachedRec?.mbid && cachedRec?.entityType) {
            // Cache has an MBID. Preserve the ORIGINAL `resolvedVia` (how this
            // record first got resolved — `name` / `url` / `both` / `context-c1..c4` / `user`) and
            // set `fromCache: true` separately. The UI composes both into a
            // label like `name (cache)`. Records written before `resolvedVia`
            // existed fall back to the literal `cache` (still flagged
            // `fromCache: true` for symmetry, but the label is just `cache`).
            const via = cachedRec.resolvedVia || 'cache';
            // `urlLinkedIds` was added later — old records lack it. Synthesise
            // for via='url'/'both' (we know the linked MBID by definition);
            // leave undefined otherwise so review-table falls back to query.
            let cachedLinkedIds = cachedRec.urlLinkedIds;
            if (cachedLinkedIds === undefined && (via === 'url' || via === 'both')) {
                cachedLinkedIds = [cachedRec.mbid];
            }
            // Heal records poisoned by the pre-fix code, which wrote [] when
            // the URL lookup merely FAILED (#193 chip bug): an empty list
            // from cache can't be trusted — drop it so the review-table
            // re-checks the row live.
            if (Array.isArray(cachedLinkedIds) && cachedLinkedIds.length === 0) cachedLinkedIds = undefined;
            if (cachedRec.name) {
                return buildResolved(cachedRec.mbUrl, cachedRec.name,
                                     cachedRec.disambiguation || '', via,
                                     cachedRec.entityType, true, cachedLinkedIds,
                                     cachedRec.creditOverride);
            }
            // Name missing — fetch it once, write back, return.
            const info = await fetchMbEntityInfo(cachedRec.entityType, cachedRec.mbid);
            if (info.name) {
                await writeIdbRecord(key, {
                    name: info.name,
                    disambiguation: info.disambiguation,
                });
            }
            return buildResolved(cachedRec.mbUrl, info.name, info.disambiguation,
                                 via, cachedRec.entityType, true, cachedLinkedIds,
                                 cachedRec.creditOverride);
        }
        if (cachedRec && Array.isArray(cachedRec.nameMatches)) {
            // Negative cache hit — we previously ran MB queries for this
            // Discogs id and found no auto-resolve target. Return the
            // remembered candidate list without re-querying MB so that an
            // immediate page reload doesn't redo every unresolved-entity
            // round-trip. Use the "🔄 Refresh from MB" button to bypass.
            // Same poisoned-[] heal as above (#193 chip bug).
            const attnLinkedIds = (Array.isArray(cachedRec.urlLinkedIds) && cachedRec.urlLinkedIds.length === 0)
                ? undefined : cachedRec.urlLinkedIds;
            return buildAttention(cachedRec.nameMatches, false, null, attnLinkedIds, cachedRec.creditOverride);
        }
    }

    // ── 2. Contextual artist search ─────────────────────────────────────────
    // Source URLs are already a stronger identity signal, so this is deliberately
    // limited to name-only credits (Apple / Deezer / most Qobuz / Titles).
    if (kind === 'artist' && !parsed && releaseMbid) {
        try {
            const contextual = await findContextArtistMatches(searchName, releaseMbid);
            if (contextual.matches.length === 1) {
                const hit = contextual.matches[0];
                const mbUrl = `//musicbrainz.org/artist/${hit.id}`;
                const contextVia = `context-c${contextual.circle}`;
                if (key) {
                    await writeIdbRecord(key, {
                        mbid: hit.id,
                        entityType: 'artist',
                        name: hit.name,
                        disambiguation: hit.disambiguation || '',
                        resolvedVia: contextVia,
                    });
                }
                logDebug(`context: "${searchName}" resolved in circle ${contextual.circle} -> ${hit.id}`);
                return buildResolved(
                    mbUrl, hit.name, hit.disambiguation || '',
                    contextVia, 'artist', false, undefined
                );
            }
            if (contextual.matches.length > 1) {
                logDebug(`context: "${searchName}" ambiguous in circle ${contextual.circle} (${contextual.matches.length} matches)`);
                return buildAttention(
                    contextual.matches,
                    false,
                    `context circle ${contextual.circle}: ${contextual.matches.length} exact matches`,
                    undefined,
                );
            }
        } catch (e) {
            // Context is an optimisation / confidence layer, never a hard
            // dependency. A failed context lookup falls through to the existing
            // global search rather than turning a resolvable credit into an error.
            logDebug(`context: "${searchName}" lookup failed (${e?.message || e}) - falling back to global search`);
        }
    }

    // ── 3 + 4. Global name search AND URL relation, in parallel ─────────────
    // The URL lookup uses `fetchJson404`: a 404 means "this URL isn't in MB"
    // (a real answer → no relations), while `null` means the lookup FAILED
    // (timeout / 429 storm). Conflating the two was the chip bug — a failed
    // lookup got recorded (and IDB-persisted!) as "no relations", so the
    // review table showed the 🔗 add-link button for already-linked URLs
    // until the focus-return recheck corrected it.
    const [nameJson, urlJson] = await Promise.all([
        mbThrottle.fetchJson(
            `//musicbrainz.org/ws/2/${kind}?query=${encodeURIComponent(searchName)}&fmt=json&limit=${searchLimit}`
        ),
        parsed ? mbThrottle.fetchJson404(
            `//musicbrainz.org/ws/2/url?resource=${encodeURIComponent(parsed.cleanUrl)}&inc=${incRels}&fmt=json`
        ) : Promise.resolve({ notFound: true }),
    ]);

    // Name search — collect everything for the review table; pick a single
    // exact-match (case-insensitive) as the auto-resolve candidate.
    const nameSearchFailed = nameJson === null;
    const normalized = searchName.toLowerCase().trim();
    const nameMatches = !(nameJson?.[resultKey]) ? [] : nameJson[resultKey]
        .filter(a => a.name.toLowerCase().trim() === normalized || (a.score != null && a.score >= 70))
        .map(a => ({
            id: a.id,
            name: a.name,
            disambiguation: a.disambiguation || a['disambiguation-comment'] || '',
            score: a.score || 0,
        }));
    const exactNameMatches = nameMatches.filter(a => a.name.toLowerCase().trim() === normalized);
    const nameHit = exactNameMatches.length === 1 ? {
        kind,
        mbid:           exactNameMatches[0].id,
        name:           exactNameMatches[0].name,
        disambiguation: exactNameMatches[0].disambiguation || '',
    } : null;

    // URL relation — extract the first matching rel (kind-specific; places
    // also accept label rels because MB editors often file a facility as a
    // label rather than a place). Also collect ALL linked MBIDs (regardless
    // of which one we pick) so the review-table can answer "is the chosen
    // entity already linked?" without re-querying MB per row.
    let urlHit = null;
    // `undefined` = lookup failed, we genuinely don't know → review-table
    // falls back to its own per-row check. `[]` = MB answered "no relations"
    // (incl. 404 = URL entity doesn't exist). Never store the failed state.
    const urlLinkedIds = urlJson === null ? undefined : (urlJson.relations || [])
        .map(r => kind === 'place' ? (r.place?.id || r.label?.id || null) : (r[kind]?.id || null))
        .filter(Boolean);
    if (urlJson?.relations?.length > 0) {
        const rel = kind === 'place'
            ? urlJson.relations.find(r => r.place || r.label)
            : urlJson.relations.find(r => r[kind]);
        if (rel) {
            const actualKind = rel[kind] ? kind : (rel.label ? 'label' : 'place');
            const a = rel[actualKind];
            urlHit = {
                kind:           actualKind,
                mbid:           a.id,
                name:           a.name || null,
                disambiguation: a.disambiguation || '',
            };
        }
    }

    // Helper: stash the unresolved result in IDB so a page reload short-
    // circuits the MB queries (above). Skipped when the name search
    // outright failed — that's a "we don't know" state, not "we know it
    // doesn't match anything". Disagreement (name vs URL → different MBIDs)
    // also caches via this path because it's a stable user-review state.
    async function cacheAttention(matches) {
        if (key && !nameSearchFailed) {
            await writeIdbRecord(key, {
                mbid:           null,
                entityType:     null,
                name:           null,
                mbUrl:          null,
                disambiguation: '',
                resolvedVia:    null,
                nameMatches:    matches,
                // Omit when unknown (lookup failed) — never persist a guess.
                ...(urlLinkedIds !== undefined && { urlLinkedIds }),
            });
        }
    }

    // ── 4. Decide ───────────────────────────────────────────────────────────
    let resolved = null;
    let via      = null;
    if (nameHit && urlHit) {
        if (nameHit.mbid === urlHit.mbid && nameHit.kind === urlHit.kind) {
            // Both lookups returned the same MBID — highest confidence.
            // Prefer the URL hit's `kind` (it's authoritative for the
            // place-resolved-as-label case).
            resolved = urlHit;
            via      = 'both';
        } else {
            // Disagreement — needs user review. The old code silently picked
            // whichever came first (always name, because the URL lookup was
            // a fall-through); this is the latent bug that issue #32
            // proposal E fixes.
            await cacheAttention(nameMatches);
            return buildAttention(
                nameMatches, false,
                `name → ${nameHit.kind}/${nameHit.mbid}, URL → ${urlHit.kind}/${urlHit.mbid}`,
                urlLinkedIds,
            );
        }
    } else if (urlHit) {
        resolved = urlHit;
        via      = 'url';
    } else if (nameHit) {
        resolved = nameHit;
        via      = 'name';
    }

    if (resolved) {
        const mbUrl = `//musicbrainz.org/${resolved.kind}/${resolved.mbid}`;
        let finalName  = resolved.name;
        let finalDisam = resolved.disambiguation;
        if (!finalName) {
            // URL-only hit may lack name/disambiguation — fetch them.
            const info = await fetchMbEntityInfo(resolved.kind, resolved.mbid);
            finalName  = info.name || null;
            finalDisam = info.disambiguation || '';
        }
        // Persist to IDB cache for future sessions.
        if (key) {
            await writeIdbRecord(key, {
                mbid:           resolved.mbid,
                entityType:     resolved.kind,
                name:           finalName,
                disambiguation: finalDisam || '',
                resolvedVia:    via,
                // Omit when unknown (lookup failed) — never persist a guess.
                ...(urlLinkedIds !== undefined && { urlLinkedIds }),
            });
        }
        return buildResolved(mbUrl, finalName, finalDisam || '', via, resolved.kind, false, urlLinkedIds);
    }

    // Nothing resolved.
    await cacheAttention(nameMatches);
    return buildAttention(nameMatches, nameSearchFailed, null, urlLinkedIds);
}

/**
 * Run the 3-strategy resolver over every entity in parallel (concurrency
 * pool of 5). Updates a progress `<li>` as workers churn through the queue.
 *
 *   - `opts.kindOf(entity)`: returns `'artist'|'label'|'place'` or `null`.
 *     `null` ⇒ skip this entity (e.g. an unmapped Discogs `entity_type_name`).
 *   - `opts.progressLi`: DOM element to update with "M/N done — checking …".
 *   - `opts.progressLabel`: leading text for the progress line.
 *   - `opts.bypassIdb`: pass through to `resolveEntity`.
 *   - `opts.releaseMbid`: enables contextual artist resolution for name-only credits.
 *
 * Returns `{ allResults: [...] }` with skipped entities filtered out.
 */
export async function resolveAll(entities, opts) {
    const { kindOf, progressLi, bypassIdb, progressLabel, releaseMbid } = opts;
    // 5 workers, each emitting up to 2 parallel MB requests (name +
    // URL) per entity. Briefly bumped to 10 per #87, then reverted: a
    // single import calls `resolveAll` twice in parallel (artists +
    // companies), so 10 workers per call = 20 total competing for
    // `mbThrottle`'s 4 slots. The resulting burst tripped MB's rate
    // limiter and cascaded 9-second `Retry-After` pauses across every
    // worker. 5 keeps the queue full without piling on the burst.
    const CONCURRENCY = 5;
    // 50ms slot-start stagger to smooth the initial open-socket spike;
    // raising to 20ms made the burst noticeably worse during the same
    // #87 test, so it's back where it was.
    const MIN_GAP_MS  = 50;
    let done = 0;
    const inFlightNames = new Set();

    function setProgress() {
        // Push the bar to determinate mode at the current % (#82).
        // Before this change preflight only updated the text line in
        // the log; the top bar stayed in its rotating marquee. Now the
        // bar shows real progress as entities resolve.
        if (entities.length > 0) {
            try { _setProgressPct((done / entities.length) * 100); } catch (_) {}
        }
        if (!progressLi) return;
        const remaining = entities.length - done;
        const checking = inFlightNames.size
            ? ` — checking <em>${[...inFlightNames].join(', ')}</em>` : '';
        progressLi.innerHTML =
            `${progressLabel}… ` +
            `<strong>${done}/${entities.length}</strong> done${checking}` +
            (remaining === 0 ? ' ✔' : ` (${remaining} remaining)`);
        // Mirror this in-place progress onto the toolbar status line (#118). That
        // line only saw NEW log emissions, so the live churn of this single,
        // rewritten "Checking … N/M — checking X, Y" line never showed there —
        // it looked stuck. Push a plain-text copy on every update.
        try {
            const plain = `${progressLabel}… ${done}/${entities.length} done`
                + (inFlightNames.size ? ` — checking ${[...inFlightNames].join(', ')}` : '')
                + (remaining === 0 ? ' ✔' : ` (${remaining} remaining)`);
            document.querySelector('.discogs-bar')?._setProgress?.(null, plain);
        } catch (_) {}
    }

    const delay = ms => new Promise(r => setTimeout(r, ms));
    const queue = entities.map((e, i) => ({ entity: e, index: i }));
    const results = new Array(entities.length);
    setProgress();

    async function worker(slotIndex) {
        // #87 diagnostic per worker — slot start + lifecycle entries
        // land in the collapsed "Preflight diagnostics" section.
        const tag = `worker#${slotIndex}`;
        logDebug(`${tag} starting (stagger ${slotIndex * MIN_GAP_MS}ms)`);
        await delay(slotIndex * MIN_GAP_MS);
        let processed = 0;
        while (queue.length > 0) {
            const { entity, index } = queue.shift();
            const kind = kindOf(entity);
            if (!kind) {
                logDebug(`${tag} skip "${entity?.name || '?'}" — no resolvable kind`);
                done++; setProgress(); continue;
            }
            const displayName = kind === 'artist'
                ? (entity.anv && entity.anv.trim()) || entity.name
                : entity.name;
            inFlightNames.add(displayName);
            setProgress();
            const t0 = Date.now();
            logDebug(`${tag} resolving "${displayName}" (${kind})`);
            results[index] = await resolveEntity(entity, kind, { bypassIdb, releaseMbid });
            const elapsed = Date.now() - t0;
            const r = results[index];
            const outcome = r?.type === 'resolved'
                ? `resolved via ${r.logEntry?.via || '?'}${r.logEntry?.fromCache ? ' (cache)' : ''}`
                : r?.type === 'attention'
                    ? `unresolved (${r.nameMatches?.length || 0} candidates)`
                    : 'skipped';
            logDebug(`${tag} "${displayName}" -> ${outcome} in ${elapsed}ms`);
            inFlightNames.delete(displayName);
            done++;
            processed++;
            setProgress();
        }
        logDebug(`${tag} finished (${processed} entit${processed === 1 ? 'y' : 'ies'})`);
    }

    const slots = Math.min(CONCURRENCY, entities.length);
    logDebug(`resolveAll: ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}, ${slots} worker slot(s)`);
    if (slots > 0) await Promise.all(Array.from({ length: slots }, (_, i) => worker(i)));
    logDebug(`resolveAll: done`);

    return { allResults: results.filter(Boolean) };
}

/** `kindOf` helper for artists — always `'artist'`. */
export const ARTIST_KIND = () => 'artist';

/** `kindOf` for the mixed artist/label stream: honour an explicit
 *  `entity.entityType` (a music-publisher entity carries `'label'` so it
 *  resolves against MB labels), defaulting to `'artist'`. */
export const ENTITY_KIND = e => e?.entityType || 'artist';

/** `kindOf` helper for Discogs companies — maps via ENTITY_TYPE_MAP. */
export const COMPANY_KIND = c => ENTITY_TYPE_MAP[c.entity_type_name]?.entityType ?? null;
