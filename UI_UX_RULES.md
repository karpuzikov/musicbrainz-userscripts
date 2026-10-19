# UI_UX_RULES - Mandatory UI design and acceptance

Canonical rule file for every software repository under `karpuzikov`. Mirror this file at each repository root, beside `SOFTWARE_RULES.md`. It supplements all global/project rules; the newest explicit user instructions prevail.

## Mandatory requirement

> Follow the referenced UI/UX documentation. Before implementation, define the purpose and behavior of every control. Reuse a consistent design system. Never create duplicate actions, inconsistent buttons, unnecessary padding, missing icons, or broken hover states.
>
> After implementation, launch the actual application, inspect screenshots, and test every interaction, including hover, click, selection, keyboard navigation, resizing, scrolling, and error states. Compare against reference screenshots when available. Fix all discrepancies before declaring completion.

This is a **release-blocking invariant**. Compile, lint, unit tests and mocked/headless controls cannot substitute for inspecting a real rendered application on the target platform.

## Visual QA Gate - mandatory, release-blocking

**Never declare a user interface fixed or completed on code review, CSS inspection, syntax checks, a mocked widget, or a screenshot supplied by the user alone. Verify the rendered behavior.** This rule applies to all current and future `karpuzikov` GUI apps, WebView2 panels, browser extensions/userscripts and other interactive UI.

The following ordered checks are mandatory for every affected UI workflow, including previously existing controls:

1. **Design and control contract before coding.** Inventory all controls and information displayed in the affected workflow. Define each control's unique purpose, pointer/keyboard behavior, state, accessible name, minimum target geometry, persistent side effects and failure recovery. Reduce click count, remove duplicated information, and enforce a coherent shared typography/spacing/icon system.
2. **Automated real-renderer layout checks.** Render the actual current HTML/CSS/JS in Playwright Chromium/Edge or a matching platform-native automation harness, with representative realistic sample data. Cover minimum supported window, standard window, maximized window, 100% and 125% device/text scaling, long titles/paths, saved/unsaved state, hover, keyboard focus, expanded panels, selected/disabled/error states, and scroll. Assert bounding rectangles are finite and nonoverlapping for every pair of **visible interactive controls**, no control/text clips through a neighboring cell or viewport, no unintended horizontal overflow, no inaccessible hover-only action, and no hidden essential action. Screenshots must be saved for review, not only tests marked passing.
3. **Visual comparison.** Inspect actual rendered screenshots and compare with the most recent approved reference or user-provided problem screenshot. Report discrepancies and fix them before calling the update ready. New screenshots without visual inspection do not satisfy this gate; pure DOM geometry checks are insufficient for icon glyph alignment, text density and visual hierarchy.
4. **Interaction and regression tests.** Test mouse hover/click, Tab/Shift+Tab, Enter/Space/Escape, selected/disabled/error states, path selection, resizing/zoom, scrolling, restart/persistence and application-specific actions. Test long labels and worst-case data, not just a simple happy-path. Ensure layout fixes do not change business behavior, delete source data or bypass plan safety guards.
5. **Native target-platform acceptance.** Run the real application using its actual Windows WebView2 / browser / GUI renderer, capture and inspect actual screenshots, and exercise the same interactions with real representative data. Playwright Chromium/Edge HTML-fixture tests provide early regression protection but **do not replace** the application-host acceptance when WebView2 or another host differs.
6. **Evidence and truthful release gate.** Record exact test command, host/OS, runtime/viewport/DPI, screenshots or artifact paths, PASS/FAIL/NOT RUN for each test class and specific unsolved mismatches in `UI_UX_ACCEPTANCE.md` and the product's `CONTINUITY.md`. Do not publish a "fixed", "accepted", "stable" or finished UI claim while required visual checks are failed/unrun. A versioned, explicitly **Under construction ⚠️** testing build is permissible with clear missing tests.

**Automation engineering requirements:** Add reusable fixture-driven visual regression checks (prefer Playwright for embedded web interfaces), scriptable screenshot capture and geometry assertions to UI projects. Trigger them on UI changes before publishing, without introducing new end-user controls or unnecessarily inflating the application's runtime footprint. Never replace the native final acceptance with static source-string tests. Keep screenshots/test dependencies isolated from source music and app settings. If the test runner or target runtime is unavailable, report **NOT RUN** and preserve the release blocker; never fabricate a PASS.

## Radical simplicity - mandatory acceptance criterion

**The preferred UI is the smallest intuitive interface that completes every required task with the fewest possible user actions.** Optimize what the user must do, not how many features or explanations can be displayed.

1. **Minimal UI:** Remove visual clutter, redundant controls, unnecessary headings, instructional text, decorative sections and speculative options. Do not replace simple direct actions with complex widgets.
2. **Minimum clicks:** Count the actual clicks/selections from starting a common task to completion, including menus, confirmation dialogs and per-item repetition. Remove avoidable interactions; use smart defaults, remembered choices and batch operations. Make frequent actions directly accessible.
3. **No obvious explanations:** Avoid tutorial-like copy, repeated descriptions and patronizing helper text. Use short, clear labels; reserve additional guidance for genuinely ambiguous states, actionable errors and essential safety information.
4. **Immediate comprehension:** First-time users must understand what to click and what will happen without reading a guide. Use familiar patterns, meaningful icons/labels, logical grouping and consistent visual behavior.
5. **Never force repetitive menus:** For repeated decisions (such as selecting treatment for many files or tracks), provide quick inline/direct actions and appropriate apply-to-all or remembered-choice mechanisms instead of reopening a dropdown for each row.
6. **Distinct actions only:** Eliminate synonyms, near-duplicate buttons and unnecessary nested menu/dialog stages. Keep primary actions visible; expose advanced options only when needed.
7. **Preserve correctness:** Do not sacrifice requested functions, safety, reversible actions, accessible names, focus/keyboard support or necessary progress/error feedback in the name of minimalism.

**Before accepting a design, perform a task walkthrough:** Can its frequent tasks use fewer clicks? Can text or controls be removed? Can repeated work be batched? Is every option unambiguous? Can a new user succeed without instructions? Any avoidable complexity is a design defect that must be corrected before release.

## Sources and priority

- Consult the complete applicable [UXDT Guidelines](https://www.uxdt.nic.in/guidelines/) tree.
- For Windows apps also consult [Fluent 2](https://fluent2.microsoft.design/), its [layout](https://fluent2.microsoft.design/layout) and [accessibility](https://fluent2.microsoft.design/accessibility) specifications, where applicable. Respect Windows conventions.
- If the user names a reference product, **inspect actual source/components AND screenshots** if available. Matching that user's specified UI takes precedence over inventing a merely similar design. Record relevant links, revisions and screenshot sizes.
- Create a shared design system: typography, colors, spacing, dimensions, corner radii, borders, icon library, icons/strokes, active/hover/pressed/focus/disabled/error states, tables, cards, inputs, scrollbars, dialogs, and feedback. Use reusable components rather than individual handcrafted buttons.
- Treat padding as purposeful. Fluent's layout base scale is 4px. Icon-only controls do not inherit wide text-button padding; keep hit targets accessible, icons optically centered, and artwork unoccluded.
- **Never use Tkinter.** For new Python desktop GUI programs, choose PySide6 unless the user explicitly chooses another supported framework. Do not replace a functioning Python program with an unwanted Node/CLI wrapper.

## Before UI implementation: control contract

For **every** existing/new control in the affected workflow, record:

| Property | Required definition |
| --- | --- |
| Control identity | Screen, stable name/ID, icon and visual role |
| Intent | Unique function, why needed, and distinction from adjacent actions |
| Operation | Input, validation, side effects, destination, persistence |
| States | Normal, hover, focus, pressed, selected, disabled, loading, error |
| Interaction | Left/right click, keyboard, hover, multi-select and cancellation |
| Geometry | Minimum/maximum sizes, spacing, padding, hit target, DPI/responsive behavior |
| Accessibility | Visible focus, label, contrast, keyboard alternative for hover-only behavior |
| Failure recovery | Error messages, retry/undo/safe cancellation |
| Acceptance | Measurable visual reference and test result expected |

Reject duplicate actions. A selection checkmark must select; a download icon must download to a deliberately chosen destination when the user requires it. Never introduce hidden alternative behavior or a dead decorative action. Inventory the whole relevant workflow, not just changes.

## After UI implementation: mandatory real testing

1. **Launch the actual application** with the actual GUI framework and real platform widgets, using the user's target operating system (or an equivalent verified build). Confirm startup, no missing dependencies, shutdown and reopening with saved state.
2. **Capture and inspect screenshots** for every affected page and its meaningful states: hover, selection, focus, loading, progress, dialogs, empty/results, error. Capture minimum/default/large window sizes and DPI/text scaling where supported.
3. **Compare reference images side by side** for layout, content density, fonts, icons, dimensions, borders, padding, color, hover positioning, thumbnails and scroll behavior. Fix every mismatch before claiming faithful recreation.
4. **Exercise every interaction**: hover/mouse click/right click/double click, keyboard Tab/Enter/Space/Escape and shortcuts, selection/deselection/multiselect, navigation/history, scrolling, resizing, dialogs and error recovery. Verify focus restoration and keyboard accessibility to hover functions.
5. **Test real workflow outcomes**, not just signals/labels: correct search, folder selection, cancellation, queue creation and persistence, pause/stop/restart, safe rollback, settings round trip, and no unwanted actions. Include negative/error scenarios (network failures, empty/invalid data, permission errors, unavailable quality, interrupted operations).
6. **Publish a verification matrix**: each control/state and PASS/FAIL/NOT RUN, OS/GUI framework, screenshot link/path, reference compared, discrepancies and fixes. A mocked test is labeled MOCK, never PASS for actual rendering.
7. **Keep failing or unavailable test gates open**. If the target GUI cannot run in the environment, clearly say visual/runtime tests are NOT RUN, retain `Under construction ⚠️`, and never call it complete.
8. Update the product's `CONTINUITY.md` with implementation, test environment, real screenshots, acceptance status and next steps.

## Release blockers

Any duplicate action, missing or incorrectly sized icon, wasteful padding, broken hover/selection, absent artwork, inaccessible control, clipped dialog, state regression, failed real interaction or unresolved reference mismatch prevents completion. Any required unrun acceptance test similarly blocks a completion claim. Interim development builds must be labeled **Under construction ⚠️** with known test limitations; never present them as accepted/stable.
