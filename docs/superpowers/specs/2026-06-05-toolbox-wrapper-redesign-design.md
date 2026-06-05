# Toolbox Desktop `Wrapper` Redesign

**Date:** 2026-06-05
**Status:** Approved design — pending implementation plan
**Component:** `client-app/src/desktop/common/Wrapper.ts` (+ `Wrapper.scss`) and its ~52 consuming tabs

## Problem

The desktop `Wrapper` component frames the component/pattern demo on nearly every tab of the
Toolbox desktop app (52 tabs). Its current structure has three recurring problems:

1. **Unreadable line length.** The intro/`description` text renders in a full-width band across
   the top of the content area. On a wide window the lines run 200+ characters edge to edge — far
   past a comfortable reading measure.
2. **Orphaned links.** The `links` render in a `DockContainer` collapsed into the bottom-right
   corner of the viewport, visually and conceptually disconnected from the intro text they relate
   to, and easy to miss entirely.
3. **Scattered, inconsistent framing.** A heavy left-accent gradient band on top, a floating
   center-aligned demo over a radial-gradient background, and the corner dock pull in different
   directions. Because the top band's height varies with the amount of intro text and the corner
   dock comes and goes, the layout reads differently from one tab to the next.

Additionally, each demo panel repeats a breadcrumb-style title (`Grids › Standard`,
`Other › Format Numbers`) that simply duplicates the section + sub-tab the user just navigated
through.

## Goals

- Constrain intro text to a readable measure.
- Unify the intro text and the links into a single, coherent info construct rendered alongside the
  demo.
- Present an **identical layout silhouette on every tab**, regardless of how much intro text or how
  many links a given tab supplies.
- Remove the redundant breadcrumb title from demo panels; give the tab a single, clear title.
- Keep the demo itself the primary element, with the info construct clearly secondary but always
  visible.
- Drive all styling from `--xh-*` theme tokens so both light and dark themes work.

## Non-goals

- Changing the top-level app nav or the left **sub-tab** navigation. (A future pass may make the
  sub-tab nav collapsible; out of scope here.)
- Changing the mobile app or any of the standalone example apps.
- Changing the per-tab demo content itself, beyond removing the redundant outer title/icon.

## Chosen design — left info rail (Approach B)

Three layouts were mocked up and compared live against the data-rich Standard Grid tab:
a unified top **header card** (A), a **left info rail** (B), and a **slim title bar + accent
callout** (C). **B was chosen** because it is the only option that holds a constant silhouette
across tabs: a fixed-width vertical column absorbs any amount of intro text and any number of links
by flowing and scrolling internally, rather than pushing the demo down the page or varying the
header height tab-to-tab. A and C optimize for the demo's vertical space but reintroduce exactly
the tab-to-tab raggedness this redesign aims to remove, and their horizontal resource treatment
breaks down past three or four links.

### Layout

A horizontal split filling the tab's content area:

```
┌─ sub-tab nav ─┬─────────────── wrapper content ───────────────────┐
│ (unchanged)   │ ┌── info rail ──┐  ┌──────── demo region ───────┐  │
│  Standard ◀   │ │ ⬡ Title    ⟨ │  │                            │  │
│  Tree         │ │ intro text…   │  │   demo (grid / chart /     │  │
│  …            │ │               │  │   form / small component)  │  │
│               │ │ ───────────   │  │                            │  │
│               │ │ RESOURCES     │  │                            │  │
│               │ │ • link — note │  │                            │  │
│               │ └───────────────┘  └────────────────────────────┘  │
└───────────────┴───────────────────────────────────────────────────┘
```

- **Info rail:** fixed width **320px**, on the left of the wrapper content. A standard Hoist
  `panel` (see below), so it carries a header (icon + title + collapse chevron) and a scrolling
  body.
- **Demo region:** flexes to fill remaining width. A plain, centering container — **no** border,
  background, gradient, or title of its own. Intrinsically-sized demos (e.g. Clock, PinPad) center
  within it; space-filling demos (grids, charts) fill it. Child demo panels keep their own borders,
  exactly as today.
- **Gutter:** the existing wrapper padding/gap is retained between rail and demo; the heavy
  radial-gradient and top-accent-band backgrounds are removed.

### The info rail — panel chrome, custom collapse observable

> **Deliberate exception to the "use Hoist built-ins" rule.** Hoist's `PanelModel`
> collapse/resize support is **not** a good fit here. It carries real caveats — it expects the
> panel to participate as a sized, splitter-managed child within a specific flex arrangement, and
> driving a single shared collapsed state across ~52 independently-mounting instances via
> `persistWith` is exactly the kind of usage it isn't designed for. Rather than fight those
> conditions, we drive collapse ourselves with a custom observable. The user explicitly approved
> this exception.

The rail uses a **plain (non-collapsible) Hoist `panel`** purely for its header chrome (icon +
title), plus a custom collapse button as a header item:

```typescript
panel({
    title,                 // from new WrapperProps.title
    icon,                  // from new WrapperProps.icon
    width: 320,            // fixed width → constant silhouette across tabs
    headerItems: [collapseButton],   // chevron → toggles the observable below
    item: /* rail body: intro + resources */
})
```

**Collapse state is a single app-level persisted observable** — not per-instance, so it is
**global** (collapse once, applies to every tab; the conference-room / space-constrained-display
case) and persisted across sessions:

- Add to the desktop `AppModel` (accessible app-wide via the framework `XH.appModel` getter):
  ```typescript
  @bindable @persist.with({prefKey: 'wrapperRailCollapsed'})
  wrapperRailCollapsed = false;
  ```
  (`AppModel` is constructed/initialized after framework + prefs are ready, so `@persist` is safe
  there. `AppModel` already calls `makeObservable`.)
- The `Wrapper` observes `(XH.appModel as AppModel).wrapperRailCollapsed` and renders one of two
  states:
  - **Expanded:** the full 320px rail panel as above.
  - **Collapsed:** a slim vertical strip (~30px) showing only an expand affordance (and optionally
    the icon), handing full width to the demo.
- The collapse chevron in the rail header (and the expand affordance on the collapsed strip) toggle
  the observable. Because all rails read the same `AppModel` observable, the change is reflected on
  every tab and persisted via the single backing pref — one source of truth, one persistence
  provider (avoiding the shared-key-across-N-instances problem).

A small dedicated `HoistModel` singleton in `common/` is an acceptable alternative home for the
observable, but `AppModel` is the pragmatic global owner and keeps the wiring minimal.

### Rail body contents

Rendered inside the rail panel, vertically, scrolling as a unit when tall:

1. **Intro** — the existing `description` ReactNode, styled for readability (line-height ~1.55,
   slightly calmed body color via tokens). Because the column is ~320px, the measure is naturally
   readable with no max-width gymnastics. `code` and `a` styling carried over from the current
   description treatment but using neutral theme tokens (drop the hardcoded `--xh-orange` link
   color in favor of the standard link/primary token).
2. **Divider** — a thin rule (`--xh-border-color`-derived) between intro and resources. Shown only
   when both an intro and resources are present.
3. **Resources** — shown only when `links` is non-empty:
   - A small uppercase, letter-spaced, muted section label: **RESOURCES**.
   - A list; each item is a `toolboxLink` followed by its `notes` on a muted second line.
   - A leading icon distinguishes link kind: a code/file icon for internal source links (`$TB` /
     `$HR` URLs) and an external-link icon for fully-qualified `http(s)` URLs. (Derive from whether
     the raw `url` starts with `$TB`/`$HR` vs. `http`.)

### Edge-case behavior (rail always present for consistency)

- **No `links`:** omit the divider and Resources section. Rail = header + intro.
- **No `description`:** omit the intro; rail = header (+ Resources if any).
- **Neither:** rail = just the header (icon + title). Rare, but keeps the silhouette constant. (In
  practice nearly every tab supplies a `description`.)

## API changes

### `WrapperProps`

```typescript
export interface WrapperProps extends HoistProps<WrapperModel> {
    /** Component/pattern name shown in the info rail header. Required. */
    title: ReactNode;

    /** Optional icon shown beside the title in the info rail header. */
    icon?: ReactElement;

    /** Intro text / description for the demo. Rendered in the info rail body. */
    description?: ReactNode;

    /** Reference links, rendered in the rail's Resources section. Unchanged shape. */
    links?: ToolboxLinkProps[];
}
```

- **Added:** `title` (required), `icon` (optional). These replace the breadcrumb title/icon
  currently set on each demo panel.
- **Unchanged:** `description`, `links` — same types and semantics, only their rendered location
  changes.
- **`ToolboxLinkProps` / `ToolboxLink`:** unchanged.

### `WrapperModel`

- Remove the `DockContainerModel` and all dock-link machinery (`onLinked`, `createLinksWithNotes`,
  the `XH.getPref('expandDockedLinks')` read).
- The model becomes minimal or is eliminated. Collapse state lives on `AppModel` (see above), not
  in `WrapperModel`.

### `AppModel` change

- Add the `@bindable @persist.with({prefKey: 'wrapperRailCollapsed'}) wrapperRailCollapsed = false`
  observable described above (with a `toggleWrapperRailCollapsed()` convenience if helpful).
- Remove the `expandDockedLinks` entry from `getAppOptions()` (the "Expand Links" switch). The dock
  is gone and the rail's collapse chevron is now the control; no app-option toggle is needed. (A
  discoverable options-dialog entry for the rail can be added later if wanted.)

### Preference change

The old `expandDockedLinks` preference becomes obsolete (the dock is gone).

- **Server:** in `grails-app/init/io/xh/toolbox/BootStrap.groovy`, replace the `expandDockedLinks`
  `PreferenceSpec` (currently `bool`, default `false`) with a `wrapperRailCollapsed` spec — still
  `bool`, default `false` (false = expanded) — to back the `AppModel` observable's `@persist`.
  Group it under `Toolbox` with updated notes.

## Styling (`Wrapper.scss`)

- Replace `.tbox-wrapper__description` (top band, accent border, gradient) and
  `.tbox-wrapper__content` (radial gradient, center) with:
  - `.tbox-wrapper` — horizontal flex container with the existing outer padding + gutter.
  - `.tbox-wrapper__rail` — minor tuning on top of the standard panel (body padding, intro
    typography, divider, resource-list spacing). Width comes from the panel's `width: 320` prop.
  - `.tbox-wrapper__demo` — flexible centering container, padded, **no** border/background/gradient.
- Resource list styles (`.tbox-wrapper__resources` label + items) replace the old
  `.tbox-wrapper__links` table styles.
- All colors via `--xh-*` tokens; verify both light and dark themes render correctly.

## Per-tab migration (~52 files under `desktop/tabs/`)

Each consuming tab needs a mechanical-but-judged edit:

1. **Lift title/icon to the wrapper.** Add `title` (and `icon` where the panel had one) to the
   `wrapper({...})` call.
2. **Choose a clean title.** Drop the redundant `Section › ` breadcrumb prefix — the section and
   sub-tab are already in the nav. Use the friendly component/pattern name (e.g. `Grids › Standard`
   → `Standard Grid`; `Other › Format Numbers` → `Format Numbers`).
3. **Remove the redundant title from the demo panel.** Delete `title`/`icon` from the **outer**
   demo panel that previously carried the breadcrumb. **Keep** meaningful inner sub-panel titles
   (e.g. Format Numbers' "Function + Options" and "Input › Output"), which label distinct regions
   and are not redundant.

The full list of files is the 52 matches of `wrapper({` under
`client-app/src/desktop/tabs/` (see e.g. `grids/StandardGridPanel.ts`, `other/formats/
NumberFormatsPanel.ts`, `other/ClockPanel.ts`).

## Files touched

- `client-app/src/desktop/common/Wrapper.ts` — new layout, new props, rail panel, model cleanup.
- `client-app/src/desktop/common/Wrapper.scss` — restyle per above.
- `client-app/src/desktop/AppModel.ts` — add the persisted `wrapperRailCollapsed` observable;
  remove the `expandDockedLinks` app option.
- `grails-app/init/io/xh/toolbox/BootStrap.groovy` — replace the `expandDockedLinks` PreferenceSpec
  with `wrapperRailCollapsed` (bool, default false).
- `client-app/src/desktop/tabs/**` — ~52 tab files: migrate title/icon, drop redundant titles.
- `CHANGELOG.md` — add an entry.
- (Possibly) `client-app/src/core/cmp/ToolboxLink.ts` — only if the internal-vs-external icon
  helper is best colocated here; otherwise the kind check lives in `Wrapper.ts`.

## Verification

- Run the app locally (`./gradlew bootRun` + `cd client-app && yarn start`) and visit a
  representative spread of tabs: a grid (with its own options sidebar), a chart, a form, a
  no-links tab (Format Numbers), and a tiny-demo tab (Clock).
- Confirm: constant rail silhouette across tabs; readable intro measure; resources with notes;
  Resources section omitted on no-link tabs; small demos center cleanly without the old gradient;
  no leftover breadcrumb titles; meaningful sub-panel titles retained.
- Toggle the rail collapse chevron; confirm it reclaims width and that the collapsed state
  **persists across reloads and applies to all tabs** (single `AppModel.wrapperRailCollapsed`
  observable).
- Toggle light/dark theme; confirm both render correctly.
- `cd client-app && yarn lint` and the TypeScript compile (the pre-commit hook) pass.

## Out of scope / future

- Making the left sub-tab nav collapsible (separate pass).
- Any optional app-options-dialog control for the rail (the chevron suffices for now).
- User-resizable rail width (fixed at 320px for consistency; could be added later if wanted).
