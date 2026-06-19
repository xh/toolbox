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
- **Example-screen pattern (move B) - COMPLETE, all 14 examples.** `pullUpSheet` +
  `exampleScreen` verified: peek bar, expand/collapse + scrim, Info (markdown), Options (labeled
  rows with working controls), segmented switching, and **live binding** (toggling an option updates
  the demo behind the sheet - confirmed via Forms "Required markers" and Scrollable Panel "Add lots
  of content"). Converted: **Grids, Tree Grids, Zone Grids, DataViews, Forms, Charts, Tree Map,
  Buttons, Icons, Popovers, Popups, Containers, Panels, PinPad.** The two tab-container examples
  (Containers, Panels) wrap *each* tab's content in its own `exampleScreen` and move the Onsen tab
  switcher to the top (`switcher: {orientation: 'top'}`) so the per-tab pull-up sheet at the bottom
  never collides with it - mirroring how the desktop wraps each tab in its own `wrapper`. PinPad
  gained a "Reset" option in its sheet (mirroring desktop).
- **Forms worked example - COMPLETE, later reworked (see build-out below).** Light collapsible
  field-set headers (no bordered panel-in-panel), label-above fields with required `*` markers and
  16px inputs, and display options moved into the sheet. The generic first cut (name / customer /
  movie + a captioned boolean trio) was subsequently recast as a validated candidate-intake form -
  see the example library build-out section.
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

- **Example library build-out (post-move-B) - COMPLETE & verified on-device.** Beyond the initial
  conversion, the example set was enriched and expanded, leaning on the now-scalable options sheet:
  - *More display options* surfaced across existing examples (all mobile-sensible and
    runtime-settable): Grid (cell borders, hide headers), Zone Grid (sizing mode, row borders, stripe
    rows), Tree Grid (cell borders, summary row), TreeMap (color mode + tiling algorithm, applied live
    to both the simple and split maps), DataView (item height), Panels/Intro (mask, loading indicator,
    show-header), Popovers (position + backdrop). `showHover` was deliberately *excluded* - no hover
    on touch. Buttons intentionally keeps showing all intents (easier to scan than a toggle), and
    HBox/VBox were left untouched pending further thought.
  - *Icons* reworked from a static three-column table into a filterable, tap-to-copy gallery (name
    filter, Style + Intent options, live count), mirroring the desktop rework.
  - *Forms* recast as a mock candidate-intake form (validation + field-set grouping): two collapsible
    `FormFieldSet`s (Candidate Details / Employment) with required / length / email / date / numeric
    rules, a conditional rule (years-experience required with a higher bar for managers), a cross-field
    rule (end date after hire date), a computed full name, and a reason-for-leaving field enabled only
    once an end date is set. Submit validates and reports failures via toast. Mirrors the desktop
    example; the desktop `enableMulti` tags field and references subform are omitted (mobile `Select`
    has no multi-select).
  - *New examples:* **Inputs** (gallery of Text / NumberInput / DateInput / Choices / Toggles cards,
    plus a global Disabled option - the building blocks, distinct from the validation-focused Forms
    example), **Select** (basic, `enableFilter`, async `queryFn` full-screen picker via
    `enableFullscreen`, `enableCreate`), **Badge** (intents + compact + in-context counts), **Mask**
    (show / spinner / message toggles + a timed "mask for 3 seconds" action), **Tabs**
    (`TabContainer` with icon + title tabs and a switcher-position top/bottom option).
  - *Nav reorg:* PinPad moved from Forms to Components. The nav blade now reads Grids & Data · Charts ·
    Forms (Forms, Inputs, Select) · Layout (Containers, Panels, Tabs) · Components (Badges, Buttons,
    Icons, Mask, PinPad, Popovers, Popups) - **19 example screens** total (plus Home).
  - *Framework change (hoist-react):* added an `equalSegmentWidths` prop (default `true`) to the
    mobile `SegmentedControl` so fill-mode segments divide the row into equal parts (the iOS/Material
    convention) rather than each sizing to its content. Committed to hoist-react `develop` and pushed;
    the interim Toolbox CSS override was removed once the framework default landed.

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

- **In-app docs reader** - deferred by design (mobile Resources links open the system browser until
  it exists).
- **`TextInput.leftIcon` on mobile (dependency, not app work)** - the Icons filter and the email /
  filter fields in the Inputs, Forms, and Select examples pass `leftIcon`. The glyph renders only
  once a published `@xh/hoist` snapshot includes the hoist-react `TextInput.leftIcon` addition
  (currently local-only, tangled with separate login-screen WIP). `enableClear` already works on the
  bundled build, so the fields are fully functional without the icon in the meantime.

No other planned mobile work is outstanding - moves A, B, C, the polish pass, and the example
library build-out are all complete and verified. Optional, not planned: further dedicated input
sub-tabs beyond Select, and the app-bar / peek-bar title de-duplication noted below.

### Follow-up considerations

- Per-page app-bar title: DONE in the polish pass - the app bar now shows the active section name
  (resolved from the nav catalog, parent-section for drilldowns). The example name still also appears
  in the sheet peek bar; de-duplicating those two could be a future tidy-up.
- Edge-swipe to open the blade: NOT viable as a from-anywhere gesture - the Navigator already uses
  edge-swipe as its back gesture (the design handoff did not account for this). A possible narrow
  follow-up is to open the blade on edge-swipe only at the home/root page, where there is no page to
  pop, and only if it composes cleanly with the Navigator's existing back-swipe handling. The
  hamburger remains the primary trigger. Not in scope now.
