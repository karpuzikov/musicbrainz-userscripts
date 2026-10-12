# UI/UX Acceptance Register

**Policy:** [UI_UX_RULES.md](UI_UX_RULES.md) and [SOFTWARE_RULES.md](SOFTWARE_RULES.md) are mandatory for every user-facing screen, panel, modal, widget, context menu, installer, browser toolbar, and interactive console prompt in this repository.

**Status as of 2026-10-12:** **NOT VERIFIED - Under construction ⚠️ for UI acceptance.** This is a documentation and source-inventory checkpoint, NOT a claim that existing applications have been retested or that published stable version labels were changed. No Windows/browser interactive visual run or reference-screenshot comparison has been performed in this audit. Existing stable releases are not silently altered.

Before ANY UI modification, record a control contract for the affected workflows: **control name/ID, unique purpose, click/right-click/hover/keyboard behavior, selection, side effects, persisted data, cancel/error handling, disabled/focus/active states, icon and target geometry**. Eliminate duplicate actions; share design tokens/components.

### Required acceptance process for EACH UI application

1. Run **the actual application**, on its target OS/browser/Picard host, with its real GUI renderer (not mocks).
2. Screenshot each screen and critical state, using at least minimum/default/large viewport and relevant DPI scaling; record image paths and viewport.
3. Compare screenshots to named reference/source UI. Check content hierarchy, alignment, 4px-based spacing, sizing, icon strokes, buttons, image loading, scroll/overlay, accessible labels, and platform expectations.
4. Click/hover/right-click every control; test tab/Enter/Space/Escape, selection/multi-select, focus, resize, scroll, navigation, settings persistence, confirmation/cancel and failure recovery.
5. Include representative end-to-end tasks, empty/large data, missing images/network, interrupted processing, and safe restart. Test any file-changing/destructive action against disposable fixtures.
6. Record **PASS / FAIL / NOT RUN** separately for real rendering, interaction, reference comparison and workflow validation; never equate syntax tests or mocked widgets with a real PASS. Fix all FAIL, complete all NOT RUN before marking UI verified.

| Universal acceptance gate | Status |
| --- | --- |
| UI rules present and required before implementation | PASS - repository-level rule installed |
| Control-by-control inventory and no duplicate actions | NOT RUN |
| Real UI launch with screenshots and reference comparison | NOT RUN |
| Hover, click, keyboard, selection, scroll, resize | NOT RUN |
| Error, cancellation, persistence, restart, recovery | NOT RUN |
| Real host/OS end-to-end workflow and final acceptance | NOT RUN |

## Applications: MusicBrainz toolset and website

**Source UI products:** `userscripts/apollo_editor`, `art_station` (and `as_picker`), `credit_hoarder`, `discogs_credits`, `falcon`, `fusion`, `group_therapy`, `isrc_scout`, `mammoth`, `platform_check`, `scribe`, `string_theory`, `bandcamp_player_enhanced`; plus any user scripts introducing dialogs/panels or host controls. `docs/index.html`, `docs/stats.html`, and `dev/script-metrics` dashboard are also browser interfaces. `dev/site-proposals` are optional design mockups, not released GUI.

**Control contract/acceptance:** release edit forms, artist/recording relation tools, batch import/review/submit, preview and undo, selection and expanded lists, icon and disclosure state; prevent overlapping controls when bundled by String Theory. Verify MusicBrainz pages, supported browsers, normal/dark themes, asynchronous network errors, retry, and that no edit is submitted by a mere hover/selection.

**Live MusicBrainz and dashboard screenshots/interaction:** NOT RUN.

## Next action

Fill the control contract and real-world screenshot/interaction matrix for every UI surface above. Fix all FAIL and NOT RUN before declaring UI verified. Preserve software behavior and target-platform compatibility.
