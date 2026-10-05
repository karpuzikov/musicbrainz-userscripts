# Software Rules

These rules apply to all current and future software maintained under the `karpuzikov` GitHub account. Repository-specific rules may add stricter requirements, but must not weaken these baseline requirements.

## Universal compliance gate - release blocking

This section is a meta-rule over **every rule in this file, every project-specific rule, and every permanent software rule the user adds later**.

Unless a rule is explicitly labeled as optional/recommendation, it is a **release-blocking invariant**, not a suggestion.

### GitHub-wide rule synchronization

- The canonical global rule source is `karpuzikov/userscripts/SOFTWARE_RULES.md`.
- Every software repository maintained under the `karpuzikov` GitHub account must contain an exact current mirror of this file at its repository root.
- Whenever the canonical global rules change, synchronize the full file to every existing software repository before further software work is considered ready.
- Any newly created or newly adopted software repository must receive the current global rule file before its first modification or release.
- A stale, shortened, summarized, or selectively copied rule file is a compliance failure. Project-specific rules may add stricter requirements in separate rule files, but may not replace or weaken the complete global baseline.
- Before software work begins in any repository, verify that its mirrored `SOFTWARE_RULES.md` matches the canonical file exactly.

### Mandatory preflight

Before creating, modifying, building, publishing, or handing off any software:

1. Load/review the latest global rules in this file.
2. Load/review the target project's own rules.
3. Apply the newest explicit user instruction when it conflicts with an older rule.
4. For any user-facing UI work, re-check the relevant current UXDT guideline pages before implementation.
5. Identify all cross-cutting rules affected by the change, not only the feature explicitly requested.

### Mandatory whole-product compliance audit

Before an update is considered ready:

- Audit the **entire affected product/UI**, including pre-existing controls and behavior touched by the same workflow.
- Do not limit compliance checks to newly added lines, newly added controls, or the specific feature requested.
- Existing software is **not grandfathered**. If an existing violation is visible while updating the product, fix it in the same update.
- A violation of any mandatory rule is a **bug and release blocker**.
- Do not publish/build/hand off the update until discovered blocking violations are corrected.
- If a mandatory rule cannot literally be implemented because of platform limitations, implement the closest platform-native equivalent and explicitly document the limitation instead of silently skipping the rule.

### Enforcement by construction

Wherever practical, mandatory cross-cutting rules must be implemented through shared components/helpers so individual screens/features cannot silently omit them.

Examples include:

- filesystem-path display/open behavior;
- theme, typography, spacing and status/progress patterns;
- dependency/bootstrap behavior;
- persistent-data location;
- retry/network policy;
- update/version behavior;
- destructive-action confirmation/recovery;
- accessibility and keyboard/focus behavior.

When practical, add regression/static checks that fail validation when a mandatory invariant is bypassed.

### Final release gate

Immediately before publishing or handing off software, explicitly verify:

- all applicable global rules pass;
- all applicable project rules pass;
- all applicable UXDT requirements pass;
- existing affected UI/behavior was audited, not only new work;
- no known mandatory-rule violation remains.

If any item fails, the software remains **Under construction ⚠️** and the release/update is not considered complete.

## UXDT baseline - mandatory for all software

The complete UXDT Guidelines tree at `https://www.uxdt.nic.in/guidelines/` is the mandatory UI/UX reference baseline for all current and future software maintained under the `karpuzikov` GitHub account, including every nested chapter and subpage. This is not limited to the "Understanding UX" section.

When exact or current guidance matters, re-check the relevant UXDT subpage before implementation instead of relying on memory or a partial summary. For every user-facing update, this re-check is mandatory before implementation and the applicable UXDT items must be re-audited before release. Apply the guidance in a platform-appropriate way to desktop GUIs, browser userscripts, web apps, plugins, installers, console tools, and other user-facing software. Do not force web-only patterns onto native applications when the native platform has a clearer accessible equivalent.

Existing software is not considered UX-finished merely because it predates this rule. Any existing user-facing interface that is updated must be audited against the relevant UXDT guidance and improved where applicable before the update is considered ready for testing.

### Mandatory UX outcomes

- **User-centered task flow:** Organize the interface around the user's actual task, minimize unnecessary steps, surface primary actions clearly, and keep secondary/advanced actions subordinate.
- **Learnability and clarity:** A first-time user must understand the purpose, current state, available actions, and expected result without prior chat context or external documentation.
- **Consistency:** Reuse established terminology, layout, control behavior, spacing, typography, iconography, status patterns, and interaction conventions across related tools.
- **Accessibility:** Support keyboard operation where the platform permits it, logical focus order, visible focus states, descriptive control names, sufficient contrast, scalable/readable text, and assistive-technology semantics where available.
- **Color independence:** Never rely on color alone to communicate state, success, warning, error, selection, or required action. Pair color with text, shape, iconography, or another perceivable cue.
- **Readable visual hierarchy:** Use clear headings, grouping, alignment, whitespace, and typographic hierarchy. Avoid visual clutter and decorative elements that compete with the primary task.
- **Forms and data entry:** Use explicit labels, sensible defaults, constrained inputs where useful, validation close to the affected field, and actionable error messages that explain how to correct the problem.
- **Error prevention and recovery:** Prevent destructive or invalid actions when practical, confirm genuinely destructive operations, explain consequences before execution, preserve user work where possible, and provide recovery/undo when feasible.
- **System feedback:** Every interaction must provide timely visible feedback. Long-running operations must show the current stage and activity/progress instead of appearing frozen.
- **User control:** Do not unexpectedly navigate, submit, delete, overwrite, move, or modify data. Make state-changing actions explicit and reversible where practical.
- **Responsive/adaptive layout:** Web and resizable interfaces must remain usable across supported viewport/window sizes, text scaling, and zoom. Avoid clipped controls, hidden critical actions, or layouts that require unnecessary horizontal scrolling.
- **Touch and pointer usability:** Where touch use is plausible, controls must have adequate target size and spacing. Pointer-only interactions must not be the sole path to essential functionality when keyboard or native alternatives are available.
- **Performance:** Keep startup, interaction, rendering, and long-running workflows efficient; avoid blocking the UI thread when practical; lazy-load or defer non-critical work where appropriate; and provide progress for unavoidable waits.
- **Content and language:** Use concise, precise, user-facing language. Prefer descriptive action labels over generic labels such as `OK`, `Apply`, or `Process` when the action is not otherwise obvious.
- **Navigation and orientation:** Users must always be able to understand where they are, what scope they are operating on, and how to return or cancel without losing work.
- **Testing and iteration:** Test the interface against the relevant UXDT usability, accessibility, responsive, performance, and implementation checklists. For web UI, include keyboard-only use and zoom/reflow checks; for native UI, test the closest platform equivalents.
- **Design-system discipline:** Reuse shared components/patterns within a project family instead of creating one-off UI behavior. New controls should match the established system unless a deliberate improvement is being rolled out consistently.
- **No false compliance claims:** Do not label software "UXDT compliant" solely because this rule exists. Compliance/readiness must be based on an actual implementation review of the relevant interface.
- **Release blocking:** Applicable UXDT findings are treated exactly like other mandatory software-rule findings. A known applicable usability/accessibility/learnability/efficiency/navigation/forms/visual-hierarchy/performance/design-system violation blocks completion until corrected or a genuine platform limitation is explicitly documented.
- **Full-tree review:** Do not treat the linked Understanding UX page as the whole standard. The applicable review spans the complete current UXDT guideline tree, including design process, navigation/information architecture, task orientation, forms/data entry, writing/content quality, inclusivity/accessibility, technical considerations, performance, design-system guidance, implementation, UX audits, evaluation/feedback and the UX compliance checklist.

## Unified software design

### Filesystem path controls - mandatory global invariant

Whenever **any filesystem path** is displayed anywhere in any current or future software, place a folder/open-location control **immediately before the path**.

This applies globally to every UI surface, including:

- path input fields and selected-folder fields;
- read-only path labels;
- release/file details;
- maps/graphs and detail panes;
- settings;
- logs and result views;
- errors/warnings;
- dependency/status views;
- dialogs;
- tooltips/popovers where a path is presented as an actionable location;
- any future UI that exposes a local filesystem path.

Required behavior:

- If the path is a directory, the control opens that exact directory in the platform file manager.
- If the path is a file, the control opens the containing directory with that exact file selected when the platform supports it; otherwise open the containing directory.
- The open-location control must be visually adjacent to and clearly associated with the path.
- Do not render a filesystem path as plain UI text through a one-off control when a shared path-display component/helper can be used.
- Existing path displays are not grandfathered. Any software update must audit the affected product for path displays and add the control wherever it is missing.
- Missing path controls are a release-blocking compliance failure.

### Dark-theme UI

- All new and updated GUI software uses a dark theme by default unless the user explicitly requests otherwise.
- Related GUI tools must reuse the established visual language of the closest existing tool, including palette, font family, font sizes, spacing, control sizing, progress/status presentation, and activity/log styling.
- When a specific existing tool is named as the UI reference, match its typography hierarchy as well as its colors. For the Duplicate Edition Analyzer family, use Segoe UI 9 for normal text, Segoe UI 10 bold for section headings, Segoe UI 15 bold for major headings, and Cascadia Mono 9 for activity/log text where monospaced text is appropriate.

### Self-explanatory UI

A first-time user must be able to understand every core UI element without prior chat context, a README, or remembering how the tool works.

- Avoid ambiguous labels such as `Exclude X`, `Filter`, `Process`, or `Apply` when the effect is not obvious.
- Inputs must state what the user should select and what that input is used for.
- Checkboxes/options must state exactly what changes when they are enabled.
- Buttons must describe the action they trigger.
- If analysis and file modification are separate stages, the UI must say so.
- Move/delete/replace operations must identify what will happen and where affected files go.
- Progress/status text must identify the current operation instead of leaving the UI apparently frozen.
- Core behavior must be explained inline where needed, using concise technical wording rather than patronizing reassurance.
- UI wording and behavior should remain consistent across related tools.

## Self-explanatory UI and visible progress

- A first-time user must understand every control without needing prior chat context or a README.
- Prefer short, affirmative labels that describe the effect directly. Avoid inverted or ambiguous controls such as "Exclude ..." when a clearer "Save ..." / "Keep ..." label exists.
- Do not solve clarity problems by filling the window with explanatory paragraphs. Keep the main UI concise; use clear labels, layout, and tooltips for secondary detail.
- Every long-running operation must visibly prove that it is active: show the current stage, a progress bar where measurable, processed/total counts, elapsed time, and a compact activity/log area when multiple stages are involved.
- Software must not appear frozen while doing background work.

## MusicBrainz request reliability

This is a mandatory global rule for **all current and future MusicBrainz-related software**, including userscripts, desktop tools, importers, matchers, lookup utilities, and any other software that sends requests to MusicBrainz.

- Any MusicBrainz HTTP request that receives **HTTP 503 Service Unavailable** must automatically retry.
- 503 retries are **unlimited**. Do not stop after a fixed attempt count.
- Continue retrying until MusicBrainz returns a response whose status is not 503.
- Respect the `Retry-After` response header when MusicBrainz provides one.
- When `Retry-After` is absent or invalid, wait at least 5 seconds before retrying to avoid hammering the service.
- Once a non-503 response is received, resume the software's normal handling for that status. Do not turn permanent 404/400/etc. responses into infinite retry loops.
- A timeout, network failure, 429, or other status may use its own existing policy, but **503 must never fail permanently because an attempt limit was reached**.
- This rule applies to every MusicBrainz request path, not only primary API calls. It includes Web Service requests, same-origin MusicBrainz helper endpoints, edit-preview/data requests, URL lookups, artist/recording/release lookups, and MusicBrainz requests made through `fetch`, XHR, `GM_xmlhttpRequest`, or equivalent clients.
- New MusicBrainz-related code must use a shared 503-retry helper or equivalent centralized mechanism wherever practical so individual features cannot silently omit this behavior.

## Userscript distribution and update integrity

This is a blocking rule. A userscript update is not considered published until every check below passes.

### Hard post-update delivery gate

This gate exists specifically to prevent a same-version Tampermonkey **Reinstall** screen and to enforce the user's rule: **never provide commit links**.

- Never give the user a GitHub commit link.
- Never give the user a GitHub commit-page URL as a substitute for an installer/update link.
- After publishing or modifying an already-installed userscript, do not provide any installer-capable URL unless it is explicitly safe at that moment.
- A direct userscript installer URL is allowed only when one of these is true:
  1. the user explicitly wants a first install and the script is not installed; or
  2. the user's installed version is explicitly known to be lower than the verified target version.
- If the installed version is equal to the target, unknown, may already have auto-updated, or cannot be re-verified, do not provide a direct `.user.js` installer URL. Tell the user to use Tampermonkey's native **Check for userscript updates** instead.
- Never use a GitHub `blob/.../*.user.js` page as a supposedly safe fallback. Tampermonkey can intercept userscript file pages and open them as raw installers.
- If a safe non-installer repository reference is genuinely useful, use a normal repository or directory page, never a commit page.
- Never use wording such as `Download / Install`, `Update here`, or `Install latest` when the user's installed version may already equal the target.
- This gate overrides any earlier preference to provide a link after every update when providing such a link could trigger **Reinstall** or would require a commit link.
- Before sending every post-update reply, perform this exact final check:
  - Does the reply contain a GitHub commit link? If yes, remove it.
  - Does the reply contain a direct `.user.js` installer or another installer-capable userscript URL?
  - If yes, is the installed version explicitly known **right now** to be lower than the target, or is this explicitly a first install?
  - If not, remove that installer link and tell the user to use Tampermonkey's native update check.
- Failure of this gate is a production-stop condition. Do not continue unrelated publishing until the delivery mistake is corrected.

### Tampermonkey-native updates only

- Userscripts must rely on Tampermonkey's native update mechanism through `@updateURL` and `@downloadURL`.
- Do not add custom in-page update checkers, update popups, update banners, version polling, GitHub API update checks, or custom Update buttons unless the user explicitly requests that exact behavior.
- Do not maintain a separate hard-coded current-version constant for update detection.
- When an installed userscript needs updating, increase `@version` and let Tampermonkey handle update detection and installation.

### Tampermonkey UPDATE vs REINSTALL

- A direct `.user.js` install URL is **not** an update button. If its `@version` equals the installed version, Tampermonkey correctly shows **Reinstall**, which can reset script settings.
- Never label, present, or describe a direct `.user.js` link as **UPDATE** unless the user's installed version is explicitly known and is lower than the linked script's verified `@version`.
- If the installed version is equal to the target version, never tell the user to open the direct userscript URL. State that the current version is already installed.
- If the installed version is unknown, call the direct link **Install latest** only; do not call it **Update**.
- For already-installed scripts, the normal update path is Tampermonkey's native update mechanism using an increased `@version` plus `@updateURL`/`@downloadURL`.
- Never manufacture a version bump solely to turn a same-version Reinstall screen into an Update screen.

### Distribution URLs

- Never use query-string cache busting on GitHub Raw userscript URLs. Parameters such as `?v=1.2.3` are forbidden because GitHub Raw/CDN caching has repeatedly served stale script bodies even when the query string changed.
- Every README/manual install link for a userscript in this repository must use an immutable `raw.githubusercontent.com` URL pinned to a full 40-character Git commit SHA that contains the exact current script.
- `@downloadURL`, when present, must use the clean mutable `main` raw URL for the full `.user.js` script, with no query parameters and no commit pin.
- `@updateURL` may either use that same clean mutable `.user.js` URL or a dedicated clean mutable `.meta.js` metadata manifest on `main`. A dedicated `.meta.js` manifest is preferred for large userscripts or scripts where update detection reliability is important.
- When a dedicated `.meta.js` manifest is used, its `@name`, `@namespace`, `@version`, `@updateURL`, and `@downloadURL` must stay synchronized with the published userscript.
- Never provide a mutable `main` raw URL as a manual install link when a commit-pinned URL can be provided.

### Identity and version integrity

- Preserve userscript identity across normal updates. Existing `@name` and `@namespace` values must not change.
- Every behavior/code change must increase `@version`.
- A changed userscript must never be committed with the same or a lower `@version` than its previous repository version.
- Versions must move forward monotonically.
- Do not add/remove/change grants, sandboxing, or execution context without checking whether page globals such as `window.MB` remain accessible. Privileged Tampermonkey grants can move a script into a sandbox.

### Required publish order

1. Update the script and increase `@version`.
2. Preserve `@name` and `@namespace`; verify any grant/sandbox changes.
3. Keep `@downloadURL` on the clean `main` raw `.user.js` URL. Keep `@updateURL` on either that URL or the script's dedicated clean `main` raw `.meta.js` manifest.
4. Commit the script.
5. If the script uses a dedicated `.meta.js` manifest, publish/synchronize that manifest to the exact same `@version`.
6. Fetch the immutable commit-pinned raw userscript URL and verify its `@version` and body.
7. Update the README **Install** link to that immutable userscript URL in a separate commit.
8. Verify the userscript metadata, optional `.meta.js` metadata, version, raw source, and README link directly during the publish operation. Do not create or run a GitHub Actions workflow for this validation.
9. Before giving a direct link to the user, compare the known installed version with the target. Only call it **Update** when installed < target.

### Failure handling

- If Tampermonkey shows **Reinstall** and the installed version is lower than the intended target, distribution has failed: stop other work and repair the served source/version.
- If Tampermonkey shows **Reinstall** and installed version equals incoming version, do not reinstall. The user is already current.
- Never tell the user to click **Reinstall** as a workaround for an update problem.
- Userscript publishing must not depend on GitHub Actions. Perform required validation directly as part of the publish operation.



## GitHub Actions policy

This is a blocking repository rule.

- Do **not** create, restore, replace, or enable a GitHub Actions workflow for userscript publishing, userscript distribution, userscript version checks, README install-link checks, cache-busting checks, metadata checks, or routine repository validation.
- Do **not** create or modify any file under `.github/workflows/` unless the user explicitly requests that exact GitHub Actions workflow or explicitly asks to modify an existing workflow.
- Routine software/userscript publishing and updates must be performed by direct repository commits and direct verification, without GitHub Actions.
- Never restore the deleted `.github/workflows/userscript-distribution-check.yml` workflow or an equivalent workflow under another name.
- Existing workflows must remain narrowly path-scoped to the specific tool they were created for. They must not run on `README.md`, `SOFTWARE_RULES.md`, unrelated scripts, or ordinary repository-wide pushes unless the user explicitly requests that behavior.
- A normal userscript update, README update, rule update, or unrelated software update must not trigger GitHub Actions.
- If a validation can be done during the current publish operation, do it directly instead of creating CI.

## GitHub development status

- New or updated software must initially use `Under construction ⚠️` in the GitHub Version/status column.
- Keep `Under construction ⚠️` until the user confirms testing is complete; then replace it with the actual version.
