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
- **Home widget dashboard (move C) - COMPLETE.** Static HomePage replaced with a personalizable
  vertical stack of quiet collapsible widget cards (`cmp/WidgetCard` + a `home/widgets` catalog:
  Welcome, Start Here, Hoist Releases, Recent Commits, Meet XH, Enjoying Hoist?). Mirrors the desktop
  home set - Meet XH and Enjoying Hoist? reuse the platform-agnostic desktop widget *models*; Releases
  and Recent Commits read live from `GitHubService` (now installed on mobile) as compact tappable
  lists rather than grids. `HomeModel` (owned by `AppModel`) holds the two ordered membership lists
  (on-home XOR available, reconciled against the live catalog), per-widget collapsed state, and the
  transient manage-sheet state. The app-bar pencil (home root only) opens a "Manage widgets" sheet
  that reuses `pullUpSheet`: two groups with membership toggles + drag-reorder
  (`@xh/hoist/kit/react-beautiful-dnd`, as the mobile ColChooser), an Available empty-state, a Done
  affordance, and a home empty-state when every widget is removed. Verified on-device: render,
  collapse, manage-sheet toggle (moves widgets between groups + updates the stack live), reorder
  (logic + live re-render), and all six widgets rendering real data. No console errors.

- **Home dashboard polish pass (post-move-C) - COMPLETE & verified.**
  - *App bar:* replaced the box icon with the XH glyph logo (`core/img/xh-logo.png`) and tightened
    the hamburger/logo/title cluster; the title now shows the active section (via
    `NavBladeModel.activeTitle`, ancestor-matched so drilldowns keep the parent section name, e.g.
    "Tree Grids"); Home shows "Home".
  - *Fonts:* mobile app now ships IBM Plex Sans (standard) + IBM Plex Mono (mono) unconditionally
    (`@ibm/plex-sans` + new `@ibm/plex-mono`), applied on `body.xh-app` - no font option yet.
  - *Widgets:* softer card radius (10px) + wider gutter; lighter header/headline weights; tree-grid
    disclosure chevrons (collapsed `>`, expanded `v`); taller/rounder widget buttons via scoped
    `--xh-button-*` vars; slimmer Start Here blurbs. Releases widget shows one latest release per repo
    (single-line rows, mono version, date right-aligned); Recent Commits is a two-line layout (subject
    line 1; chip + author + date right-aligned on line 2).
  - *Manage sheet dnd:* fixed the drag-clone vertical offset (Onsen Swiper wrapper + the sheet panel
    both had transforms that became the fixed-clone containing block) by portaling the sheet to
    `<body>` and sliding the panel via `bottom` not `transform`; fixed a Done-tap ghost-click leak
    (peek now ignores taps on interactive controls); deferred the dashboard re-render while managing
    (frozen snapshot, syncs on dismiss) for smooth reordering. Added a pinned "Reset to default
    layout" footer (new `pullUpSheet` `footerItem` slot) and an orange Done CTA. Internal sheet
    components refactored to `hoistCmp` factories that auto-resolve the contextual `HomeModel`.

All changed files pass `tsc --noEmit` (0 errors), ESLint, Stylelint, and Prettier.

#### Move C persistence note - VERIFIED end-to-end

Membership/order/collapsed state persists per user via `@persist` against a new server preference,
`mobileHomeWidgets` (added to `BootStrap.ensureRequiredPrefsCreated`). Verified this session by
restarting the mobile-upgrade backend on :8080 so the pref registered: changed membership/order/
collapse, reloaded, and the state restored exactly (server pref JSON matched the model). Hoist's
`PersistenceProvider.create` also fails gently, so a backend without the pref runs on defaults rather
than crashing.

#### Local-run gotcha discovered this session

`yarn startWithHoist` (inline hoist-react) hardcoded `cd ../toolbox/client-app`, so from a
differently-named checkout it served the **sibling `../toolbox`** tree (old code). Fixed to a scoped
subshell `(cd ../../hoist-react && yarn install)` so it serves the invoking checkout. To run inline
from this checkout: `yarn --cwd client-app start --env inlineHoist --env devHost=$(ipconfig getifaddr en0)`.

### Remaining

- **Convert the other 9 example pages** to `exampleScreen` (Charts, Tree Map, Containers, Panels,
  Buttons, Icons, Popovers, Popups, PinPad). Mechanical - follow the Grids/Forms pattern: keep
  demo-intrinsic controls in the demo, move display options into `exampleOption` rows.
- **In-app docs reader** - deferred by design.

### Follow-up considerations

- Per-page app-bar title: DONE in the polish pass - the app bar now shows the active section name
  (resolved from the nav catalog, parent-section for drilldowns). The example name still also appears
  in the sheet peek bar; de-duplicating those two could be a future tidy-up.
- Edge-swipe to open the blade: NOT viable as a from-anywhere gesture - the Navigator already uses
  edge-swipe as its back gesture (the design handoff did not account for this). A possible narrow
  follow-up is to open the blade on edge-swipe only at the home/root page, where there is no page to
  pop, and only if it composes cleanly with the Navigator's existing back-swipe handling. The
  hamburger remains the primary trigger. Not in scope now.
