# Toolbox Desktop Examples - Redesign & Polish (Branch Orientation)

**Date:** 2026-06-07
**Branch:** `wrapper-redesign`
**Status:** Implementation essentially complete; handing off for **final code review**. This is a
companion/orientation doc for picking the work back up with fresh context. Read this first (see the
"Latest session" section below for the newest work + review pointers), then the two foundational
docs below.

## Purpose of this doc

This branch began as a focused redesign of the desktop `Wrapper` component and grew into a broad,
deep polish of nearly every desktop **example tab** in Toolbox. This doc orients a new agent to the
**scope, the established patterns, and the non-obvious conventions** so follow-on work stays
consistent. It is a summary, not a spec - the authoritative design lives in:

- `docs/superpowers/specs/2026-06-05-toolbox-wrapper-redesign-design.md` - the approved Wrapper
  redesign design.
- `docs/superpowers/plans/2026-06-05-toolbox-wrapper-redesign.md` - the implementation plan.

Also read the repo `CLAUDE.md` (framework reference routing, code style, commit/changelog rules) and
recall: **Toolbox's job is to be a showcase of well-structured, idiomatic, rules-following Hoist
code** - not clever or exotic. Every example is read by developers and prospective clients
evaluating Hoist. Favor the framework-blessed way; consult the `xh:using-hoist-react-reference`
tools before guessing any Hoist API.

## The big picture (what this branch did)

1. **Wrapper redesign.** Replaced the old full-width description band + corner-docked links with a
   fixed-width (320px) **left info rail** beside a clean **demo region**. The rail carries the tab's
   title + icon, an intro (Markdown), an **Options** section, and a **Resources** (links) section.
   Constant silhouette across all ~50 tabs; token-driven styling (light/dark safe); collapsible
   (per-tab, in-memory). See `client-app/src/desktop/common/Wrapper.ts` + `Wrapper.scss`.

2. **Options-rail consolidation.** The previously scattered display-option controls (ad-hoc
   tbars/bbars, the old `tbox-display-opts` side panels) were consolidated into the rail's **Options**
   section across every applicable example, via shared helpers.

3. **Deep per-example polish (the large, recent pass).** Tab-by-tab review and improvement of
   layout, controls, copy, icons, and behavior - plus bug fixes. Most commits since `aae66552` are
   this pass.

## Established patterns - USE THESE for any new/edited example

All live in `client-app/src/desktop/common/` (exported from `common/index.ts`).

### `wrapper({...})` - the per-tab frame
Props: `title` (required), `icon?`, `description?` (string | string[] **Markdown**), `options?`
(ReactNode), `links?`. The demo content is the `item`/children.
- **Descriptions are Markdown**, authored as an array of lines joined with `\n`. Within a paragraph,
  lines render space-joined; an **empty-string entry** is a paragraph break (NOT `+` concatenation -
  that coerces to comma-joined text and was a real bug we fixed). Backticks, `[text](url)` links work.

### `wrapperOption({label, control, info?, propName?})` - one display-option row
The standard label-left / control-right row used by every example's Options section. `info?` renders
muted helper text below the row (a reusable pattern - good for explaining what an option does;
the formatter examples use it heavily). **Pass `model` explicitly** to controls in the rail
(`switchInput({model, bind})`) - don't rely on context reaching the rail.

**`propName?`** (added this session) names the **qualified** Hoist API the option maps to, as
`Interface.property` - e.g. `MaskProps.inline`, `GridConfig.stripeRows`, `FormModel.readonly`. On
row hover the human `label` swaps in place for this monospace name (a `title` tooltip on the option
gives the full value when the pill ellipsizes). Conventions when setting it:
- Use the interface a developer actually reaches for: a component's `*Props` for a component prop, a
  model's `*Config` for a construction config key, the `*Model` for a runtime-settable bindable.
- **Point at the most specific class the dev constructs, not an underlying/parent one.** e.g. the
  standard grids' styling options are `GridConfig.*` (the GridModel config a dev builds), even though
  the shared helper binds through to the underlying `AgGridModel`; only the standalone AG Grid
  example uses `AgGridModelConfig.*`. Likewise `DashCanvasConfig`/`DashContainerConfig` (not base
  `DashConfig`) for the dash locks.
- Only set it for clean 1:1 mappings; leave demo-only / multi-prop / non-API controls label-only.
- Names were verified against the framework types via the hoist-react reference - re-verify if you
  touch them.

### `wrapperAction({...})` - a rail action button
Full-width, non-minimal button for a rail action/trigger. **Intent convention (apply consistently):**
- `intent: 'primary'` - the single action that *runs* the example's core behavior (e.g. "Load Now",
  "Call chart API", "Mail a link").
- `intent: 'danger'` - destructive actions that discard state (Clear / Reset).
- neutral (no intent) - secondary utilities (Save/Load state, Select random, Scroll to selection,
  View Grid Filters, Open in browser, Expand/Collapse all).

### Shared option helpers
- `treeMapDisplayOptions(model)` - the shared TreeMap appearance selects.
- `chartDisplayOptions(model)` - shared chart options (aspect ratio as a labeled select, context menu,
  "Call chart API" action).
- `gridDisplayOptions(model)` / `agGridDisplayOptions(model, configClass?)` - shared grid styling
  option rows. `agGridDisplayOptions` takes a `configClass` string (default `'AgGridModelConfig'`)
  used only for the `propName` hover hint; `gridDisplayOptions` passes `'GridConfig'` so the
  GridModel-based examples point devs at the config they actually construct.
- `gridDisplayActions(model)` - grid selection-demo actions.
- `expandCollapseButton({gridModel})` - a toggle action for tree grids (wraps `GridModel`
  expandAll/collapseAll with its own toggle state).

## Cross-cutting conventions / gotchas

- **No em dashes** (`-` only) anywhere in copy or comments. They read as an AI tell. This was swept
  across the codebase; keep new copy clean. (Middots `·` are fine where intentional, e.g. the chart
  title separator.)
- **`segmentedControl` is being actively promoted** over `buttonGroupInput` - prefer it for small
  mutually-exclusive choices (outlined where it reads well).
- **Toolbar grid controls** (count label, autosize/chooser/export) follow the `SampleGrid` pattern:
  in the **top** toolbar, right-aligned after a filler. Don't invent per-example placements.
- **Per-example curation is expected** - not every grid gets the generic display options; surface
  what's relevant to *that* example and omit distractions (e.g. Column Filtering shows only its
  filter controls).
- **Dashboards** (`tabs/layout/dashCanvas`, `tabs/layout/dashContainer`) persist via
  `localStorageKey`. When you change default content/layout incompatibly, **bump the key** (e.g.
  `...StateV2` -> `...V3`) so stale saved state can't spoil the first impression; defaults are demo
  data and need not be retained. Ensure the **Reset** action restores cleanly (`restoreDefaults()`),
  and that widgets re-sync from `viewState` (a widget that reads viewState only in `onLinked` will
  not pick up a Reset - add a reaction; see `OptionsWidget`).
- **Commits:** small and frequent, one logical change each (PRs squash-merge to `develop`). The
  Husky pre-commit hook runs prettier + eslint + tsc; let it run. No hard-wrapping in commit bodies;
  bullet the key points. Only commit when asked. Never force-push the feature branch.
- **Validation:** the dev app runs at `http://localhost:3000` (frontend) / `:8080` (backend). Use the
  Chrome tools to visually verify changes. Create your OWN browser tab; SPA navigation does NOT
  reload the JS bundle, so **hard-reload** (`location.reload()`) to pick up edits.

## What's been touched (high level)

- **Wrapper + rail:** core component, styling, collapse, Resources link kinds/icons, `wrapperOption`
  (+`info`), `wrapperAction`, options consolidation.
- **Formatters** (Format Numbers/Dates): options moved to rail as consistent `wrapperOption` rows
  (function = select, colorSpec = segmentedControl, with `info` text); models converted FormModel ->
  plain `@bindable`; output card fits contents.
- **Grids:** Standard/Tree/TreeWithCheckbox/ColumnFiltering/InlineEditing/AgGridView/DataView/etc.
  Column Filtering toolbar trimmed to its own controls; Inline Editing toolbars reworked into a
  real-form shape (Commit/Revert in a bottom footer; grouped add buttons) and the "Edit first
  row/amount" bug fixed; tree grids got an expand/collapse toggle.
- **Charts:** aspect ratio -> labeled select ("Unconstrained" default); TreeMaps use `Icon.treeMap()`
  and group clustering last.
- **Layout:** HoistInputs 4-col -> 3-col; TileFrame/Dash Reset/Clear actions -> `wrapperAction`
  (danger); **dashboard widgets** renamed `ButtonWidget` -> `OptionsWidget` (now an outlined
  `segmentedControl` with Live/Hourly/Daily options + settings icon); the dashboard **Chart widget**
  is now a self-contained live random-walk price monitor (managed `Timer`, `ChartModel.setSeries`,
  floats a `fmtPrice` value into the view title via `titleDetails`); dashboard default layouts and
  view icons refreshed (tree-list, skull for Error).
- **Other:** Icons gallery (style/intent -> rail, searchable gallery, count unstyled), Markdown
  (bordered sub-cards + meta note that the rail itself renders Markdown), JSX (correct `jsx`
  CodeMirror language mode), Mobile tab (link actions -> rail), Simple Routing (description fix),
  Relative Timestamp (simplified target controls + cleaner output), Basic panel (context-menu option
  -> rail), Mask/Loading Indicator (Load Now reflects loading via the shared `TaskObserver`).
- **App shell:** left sub-tab nav restyled (rounded items, hover, active pill + accent bar);
  top-level "Examples" tab relabeled "Example Apps".

## Latest session (2026-06-07, continued) - new work + notes for the reviewer

A follow-on session added the items below (each its own commit on top of `7fb81d95`; tree is clean
apart from the untracked `OPTIONS-PANEL-EVALUATION.md`). A fresh agent is expected to do **final
code reviews** next - the pointers here flag the judgment calls worth a closer look.

**New work (commits):**
- **Options prop-name disclosure** (`9347ead1`, `356b5b5d`, `68b42bdc`) - the `wrapperOption.propName`
  feature above (hover-swap + `title` tooltip), plus single-click expand on the collapsed rail. The
  qualified names were filled in across ~all example Options and verified against framework types.
- **Dock Container** (`826a7319`) - actions moved to rail `wrapperAction`s; demo region is a
  space-filling card with a reactive `placeholder` (live docked-view count). Fixed `' Error View'`.
- **FileChooser** (`a9a364a7`) - reframed as two equal `card`s (top: configurable chooser fills;
  bottom: two compact single-file choosers sharing space), max-width capped, copy trimmed.
- **Format Dates/Numbers** (`e2a8b63d`) - date samples now `{date, label}` pairs (human left-column
  descriptions instead of raw `toString()`); number "Custom value" row labeled + prepopulated +
  `selectOnFocus`.
- **Mobile** (`1d8eca78`) - replaced the dated baked-frame screenshots with a CSS device frame
  (`phoneFrame` in `MobileTab.ts`): bezel, large radius, faux status bar (clock + "XH mobile" +
  signal/battery), home-indicator pill, side buttons. **Frame coloration AND the screenshot content
  both track the desktop theme** via `XH.darkTheme` (theme-aware CSS vars + light/dark capture pairs).
  Two screens (home + form), each captured per theme. See `tabs/mobile/README.md`.
- **Misc tweaks** - Toolbar inner panel retitled "Panel with Toolbars" + `Icon.window()` (`1f721907`);
  Panel Sizing Expand/Collapse All moved to rail, inner tbar removed (`81f8fa10`); Relative Timestamp
  output got internal vertical padding (uncommitted at handoff unless noted).

**Notes for the reviewer (judgment calls to sanity-check):**
- **propName accuracy.** A few are routed indirectly: Mask/LoadingIndicator "Message" map to
  `MaskProps.message` / `LoadingIndicatorProps.message` though the demo drives them via a
  `TaskObserver`; `PanelConfig.resizeWhileDragging` is set at construction but toggled at runtime in
  the demo. These were deliberate "what would a dev type" calls - worth a glance.
- **Mobile screenshots.** They are real captures, but `html2canvas` blanks navigated Onsen swiper
  slides in **light** theme (only the root slide captures); the light Form shot was taken by
  temporarily making Form the root page (reverted). The mobile client is slated for a redesign, so
  these are deliberately "good enough" placeholders - the `README.md` documents recapture.
- **Reverted experiment.** Per-sub-tab icons in the left switcher were tried and **reverted** (a
  design review judged the shared feature-icons added noise / false grouping). The switcher stays
  text-only at 150px with the existing modern hover/active styling. Don't re-add without a rethink.

## Framework bugs filed against hoist-react (found during this work)

- **#4418** - `GridModel.beginEditAsync()` ignores a record id of `0` (falsy check). Worked around in
  the Inline Editing example by passing the `StoreRecord` instance.
- **#4419** - `SegmentedControl` option labels don't wrap/truncate gracefully when space-constrained.
- **#4420** - `LoadingIndicator`'s spinner inherits the global `--xh-spinner-color` and reads
  low-contrast against the indicator's own background in both themes (weaker than its message text).
  No Toolbox override involved; suggested scoping the spinner to `--xh-loading-indicator-color`.
- (Earlier) a `core/README.md` doc clarification re: `@managed` vs context lookup - see auto-memory.

## Open items / things to watch

- `OPTIONS-PANEL-EVALUATION.md` (repo root, untracked) is a stale handoff note from the options-rail
  phase - safe to delete.
- A consolidated `CHANGELOG.md` entry covering this whole example-polish pass has not been written.
- `DashViewModel.titleDetails` is **string-only** (rendered via `fullTitle` string-join and, for the
  container, DOM `textContent`). Styled/`ReactNode` title content is not cleanly supported without a
  framework change - do not hack it in.
