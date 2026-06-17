# Toolbox Mobile UI Upgrade - Design & Progress

Date: 2026-06-16
Branch: `mobile-upgrade`
Source brief: `.tmp/design_handoff_toolbox_mobile/` (README + `Toolbox Mobile Upgrade.dc.html` + screenshots)

This carries the recently-committed desktop UI redesign to the Toolbox **mobile (phone)** client.
Phone form factor only - tablets continue to load the desktop app by design.

## Scope & sequencing (agreed)

Delivered as separate commits on the `mobile-upgrade` branch, one squash-merged PR. Build order:
A (nav blade) → B (example-screen pattern + Forms) → C (home dashboard). The in-app **docs reader is
deferred** per the brief; mobile Resources links open the system browser until it exists.

## Architecture

Two net-new primitives were built **app-local** under `client-app/src/mobile/cmp/`, cleanly bounded
so they can later graduate into the shared `@xh/hoist/mobile` kit (the brief expects this):

- **`navBlade`** (`cmp/navBlade/`) - left scrim-backed drawer. `NavBladeModel` owns open/closed
  state, per-group expand/collapse, the static group catalog, and active-route detection
  (`XH.routerState`). Dismisses on scrim tap, item navigation, or any route change.
- **`pullUpSheet`** (`cmp/pullUpSheet/`) - bottom sheet with peek + expanded snap states over a
  scrim. Controlled (`isExpanded` / `onExpandedChange`). Tap or drag-threshold to toggle. Shared by
  the example Options sheet and (planned) the home Manage-widgets sheet - one vocabulary.
- **`exampleScreen`** (`cmp/example/`) - mirrors desktop `common/Wrapper.ts`. Renders the demo
  full-bleed with a `pullUpSheet` whose peek bar shows the example name + live options-count chip,
  and whose expanded body is a segmented **Info · Options · Resources** control. Helpers:
  `exampleOption` (label/control row), `exampleAction` (full-width action button). Resources reuse
  `ToolboxLink`'s link classification but open externally (no mobile docs reader yet).

### Key implementation notes / gotchas

- Hoist element factories normalize `item`/`items` into `children`. A custom factory prop named
  `item` is therefore swallowed - `pullUpSheet` reads `children` for its body, and `exampleOption`
  names its control prop `control` (not `item`). This bit twice during development.
- Hoist layout `box`/`vbox`/`vframe` set `position: relative` inline, overriding CSS `position`.
  Absolutely-positioned containers (the sheet panel, the demo fill) use plain `div` + CSS flex.
- `@bindable` setters are untyped at compile time; use `model.setBindable('x', v)` (as elsewhere in
  the repo) rather than `model.setX(v)`.
- Bind to real `--xh-*` tokens, not the brief's reference hexes. Brand orange is `--xh-orange`
  (the brief called it `--xh-brand-orange`).
- The global app bar is omitted in landscape (`omit: XH.isLandscape`). On a desktop monitor
  `screen.orientation.type` reports landscape regardless of window shape, so for local browser
  testing force portrait: override `screen.orientation.type` to `portrait-primary` + dispatch a
  `resize` event.

## Status

### Done & verified in-app (logged in as a local test user, phone viewport)

- **Nav blade + AppMenu tweak (move A) - COMPLETE.** Hamburger opens the blade; Home + 5 groups
  (Grids & Data, Charts, Forms, Layout, Components) per the brief; active highlight; groups expand
  in place; sub-item navigation closes the blade; back button replaces the hamburger on sub-pages;
  Theme toggles from the footer (app + blade re-theme, sheet stays open); Settings opens the Options
  dialog; AppMenu no longer shows a Theme item. No console errors.
- **Example-screen pattern (move B) - foundation + 5 of 14 examples.** `pullUpSheet` +
  `exampleScreen` verified: peek bar, expand/collapse + scrim, Info (markdown), Options (labeled
  rows with working controls), segmented switching, and **live binding** (toggling an option updates
  the demo behind the sheet - confirmed via Forms "Required markers"). Converted: **Grids, Tree
  Grids, Zone Grids, DataViews, Forms.**
- **Forms worked example - COMPLETE.** Light collapsible field-set headers (no bordered
  panel-in-panel), label-above fields with required `*` markers and 16px inputs, captioned boolean
  trio (Checkbox · Switch · Button - mobile has no radio input), and options (Read-only, Minimal
  validation, Commit on change, Required markers, Density, Reset form) moved into the sheet.

All changed files pass `tsc --noEmit` (0 errors), ESLint, and Prettier.

### Remaining

- **Convert the other 9 example pages** to `exampleScreen` (Charts, Tree Map, Containers, Panels,
  Buttons, Icons, Popovers, Popups, PinPad). Mechanical - follow the Grids/Forms pattern: keep
  demo-intrinsic controls in the demo, move display options into `exampleOption` rows.
- **Home widget dashboard (move C)** - not started. Welcome-as-widget vertical stack with quiet
  panel headers + collapse-to-title; a pull-up **Manage widgets** sheet (reusing `pullUpSheet`) with
  On your home / Available groups, membership toggles + drag-reorder (`@xh/hoist/kit/react-beautiful-dnd`,
  as the mobile ColChooser uses); persist per user via `@persist`/`PrefService`. Widgets mirror the
  desktop `HomeTab` set (Welcome, Start Here, Hoist Releases, Recent Commits, Meet XH, Enjoying
  Hoist) backed by existing `GitHubService` etc.
- **Edge-swipe to open the blade** from sub-pages (currently the hamburger only shows at root, per
  the mockups; edge-swipe is the intended from-anywhere gesture, left as a tunable enhancement).
- **In-app docs reader** - deferred by design.

### Follow-up considerations

- Per-page app-bar title: the mockups show the example name in the app bar on sub-pages; today the
  global app bar shows the app name + back, and the example name lives in the sheet peek bar. A
  consolidation pass could route the page title into the app bar via `XH.routerState`.
