# Toolbox ↔ Hoist React Documentation Alignment Plan

## Goal

Reorganize the Toolbox desktop application's tab hierarchy and demo coverage to better align with how hoist-react documentation is structured and packaged. This is a big but incremental upgrade — primarily moving and improving existing examples, improving organizational structure, and filling targeted coverage gaps.

## Research Summary

### Hoist React Documentation Structure

Hoist React maintains **51 documents** across four categories:

**Core Concepts (9 docs)**
- `core` — HoistBase, HoistModel, HoistService, component factories, decorators, model lookup
- `data` — Store, StoreRecord, Field, Filter, Cube/View, validation
- `svc` — FetchService, ConfigService, PrefService, IdentityService, TrackService, WebSocketService
- `lifecycle-app` — Entry points, initialization sequence, AppSpec, terminal states
- `lifecycle-models-and-services` — Model/service lifecycles, LoadSupport, refresh
- `mobx` — @bindable, makeObservable, MobX integration
- `promise` — Promise extensions, error handling, tracking
- `utils` — Utility functions, decorators, logging
- `authentication`, `authorization`, `persistence`, `routing`, `error-handling`, `test-automation`

**Component Packages (major docs)**
- `cmp/grid` — GridModel, Column, sorting, grouping, filtering, inline editing, export
- `cmp/form` — FormModel, FieldModel, validation, data binding
- `cmp/input` — Input base classes, change/commit lifecycle, focus management
- `cmp/layout` — Box/VBox/HBox, Frame, viewport, spacing, TileFrame
- `cmp/tab` — Tabbed interfaces, routing integration, render modes
- `cmp/viewmanager` — Named view configurations, sharing, pinning, persistence

**Desktop Component Packages**
- `desktop/cmp/panel` — Layout, toolbars, collapse/resize, modal, persistence, masking
- `desktop/cmp/dash` — Dashboard with draggable widgets, ViewManager integration
- `desktop/` — Desktop-specific components overview, Blueprint wrappers

**Cross-Cutting Packages**
- `format` — Number, date, currency formatting
- `appcontainer` — App shell, dialogs, toasts, theming, environment config
- `icon` — Icon system with FontAwesome Pro
- `security` — OAuth client abstraction (Auth0, MSAL)
- `styles` — CSS variables, theming, BEM naming, SCSS conventions
- `inspector` — Developer tool for instance inspection

### Current Toolbox Desktop Tab Structure

10 top-level tabs with the following sub-tab counts:

| Tab | Sub-tabs | What it covers |
|-----|----------|----------------|
| **Home** | 0 | Dashboard landing with DashContainer widgets |
| **Grids** | 11 | Standard, Tree, Tree w/Checkbox, Column Filtering, Grouped Columns, Inline Editing, External Sort, Zone Grid, DataView, REST Editor, ag-Grid |
| **Panels** | 5 | Basic Panel, Toolbars, Panel Sizing, Mask, Loading Indicator |
| **Layout** | 8 | HBox, VBox, Card, TabContainer, DashContainer, DashCanvas, DockContainer, TileFrame |
| **Forms** | 5 | FormModel, Hoist Inputs, Select, Picker, Toolbar Forms |
| **Charts** | 5 | Line, OHLC, TreeMap, Grid TreeMap, Split TreeMap |
| **Mobile** | 0 | Single info page about mobile variant |
| **Other** | 17 | Buttons, Icons, Clock, Formatting (dates/numbers), Routing, Error Handling, Popups, Markdown, LeftRightChooser, FileChooser, Placeholder, PinPad, Timestamp, Inspector, JSX, Custom Package, App Notifications |
| **Docs** | 0 | Framework documentation viewer with doc→example linking |
| **Examples** | 7 | Standalone apps (Portfolio, Weather, Contact, TODO, News, Recalls, File Manager) |

### Docs Tab Integration

The Docs tab already provides bidirectional linking via a hardcoded `DOC_EXAMPLES` map in `docRegistry.ts`. When viewing a doc, a button/menu shows links to relevant Toolbox example tabs. This is the key integration point that needs to be expanded.

## Key Gaps & Misalignments

1. **"Other" is a 17-item dumping ground** — Many sub-tabs map to well-documented Hoist packages (icons, formatting, error handling, routing) but are buried in an unstructured catch-all.

2. **No dedicated Data/Store demo** — `data/` is one of the most comprehensive docs (Store, Field, Filter, Cube) but has no corresponding Toolbox tab demonstrating these patterns directly.

3. **Inputs not elevated** — `cmp/input` is a major doc area, but inputs are a sub-tab under Forms. The distinction between Forms (FormModel/validation) and Inputs (the components themselves) mirrors the docs but isn't reflected in tab structure.

4. **Formatting scattered** — `format/` is a prominent doc package, but Date Formats and Number Formats are orphaned in Other.

5. **Cross-cutting concepts invisible** — Persistence, error handling, and routing each have dedicated concept docs but are only single tabs in Other with no thematic grouping.

6. **Container types mixed** — Docs separate `cmp/layout` (Box primitives), `cmp/tab` (TabContainer), `desktop/cmp/panel` (Panel), and `desktop/cmp/dash` (DashContainer/DashCanvas). Toolbox puts Panel-related items in Panels and everything else in Layout.

7. **ViewManager has no demo** — `cmp/viewmanager` has thorough docs but no dedicated Toolbox example.

8. **AppContainer/theming undemo'd** — `appcontainer/` covers dialogs, toasts, theming, banners — partially covered by popups/notifications in Other but not cohesively.

9. **Doc→Example links incomplete** — `docRegistry.ts` maps some docs to examples, but many docs have no linked examples (persistence, authorization, authentication, mobx, lifecycle docs).

## Proposed Plan

### Stage 1: Restructure & Regroup

Reorganize top-level tabs to better mirror the doc hierarchy. This is mostly **moving existing examples** with renaming and light consolidation.

**Proposed top-level tabs:**

| Tab | Sub-tabs (moved/renamed from current location) | Rationale |
|-----|------------------------------------------------|-----------|
| **Home** | *(unchanged)* | Dashboard landing |
| **Grids** | Standard, Tree, Tree w/Checkbox, Column Filtering, Grouped Columns, Inline Editing, External Sort, Zone Grid, DataView, REST Editor, ag-Grid | Already well-aligned with `cmp/grid` |
| **Forms & Inputs** | Form (validation/binding), Inputs (all types), Select, Picker, Toolbar Forms | Rename from "Forms" to match `cmp/form` + `cmp/input` doc split |
| **Containers** | Panel Intro, Toolbars, Panel Sizing, Mask, Loading Indicator, TabContainer, DashContainer, DashCanvas, DockContainer, TileFrame | **Merge Panels + container-level Layout items** — mirrors `desktop/cmp/panel`, `cmp/tab`, `desktop/cmp/dash` as related container components |
| **Layout** | HBox, VBox, Card | Pure layout primitives from `cmp/layout` — simpler, more focused |
| **Charts** | *(unchanged)* | Already clean |
| **Components** | Buttons, Icons, Popups/Dialogs/Toasts, App Notifications, LeftRightChooser, FileChooser, Placeholder, Markdown, Clock, Timestamp, PinPad | **Replace "Other"** — rebranded as a proper component showcase |
| **Patterns** | Formatting (dates+numbers combined), Routing, Error Handling, Exception Handler, Factories vs JSX, Persistence *(new)*, ViewManager *(new)* | **New tab** for cross-cutting concepts that each have dedicated docs |
| **Docs** | *(enhanced doc→example map)* | Expand `DOC_EXAMPLES` for all new/moved tabs |
| **Examples** | *(unchanged)* | Standalone apps |

**Key moves:**
- **Other → Components + Patterns**: The 17-item catch-all splits into "Components" (individual UI pieces) and "Patterns" (cross-cutting concepts with doc backing)
- **Panels + Layout containers → Containers**: Panel, Tab, Dash, Dock container components unified
- **Layout narrowed**: Only pure layout primitives (HBox, VBox, Card)
- **Formatting consolidates**: Date/Number formats move from Other to Patterns, paired
- **Mobile**: Consider moving to Examples or a link rather than top-level tab (it's a single info page, not a demo)
- **Custom Package / Inspector**: Evaluate whether these belong in Components or are developer-only tools that could be de-emphasized

**Implementation details:**
- Most changes are directory renames under `desktop/tabs/` and updates to `AppModel.ts` tab definitions
- Component code itself mostly stays the same
- Route paths will change — consider redirect routes from old paths for a transition period
- Update `docRegistry.ts` `DOC_EXAMPLES` map and `TabRouteInfo` entries as tabs move
- Add bidirectional linking: example tabs should reference their relevant doc(s), not just docs → examples

**Stage 1 can itself be split for incremental delivery:**
1. **1a**: Split "Other" → "Components" + "Patterns" (highest impact, lowest risk)
2. **1b**: Merge Panels + Layout containers → "Containers" + slimmer "Layout"
3. **1c**: Rename "Forms" → "Forms & Inputs", expand doc→example links throughout

### Stage 2: Fill Coverage Gaps

With the restructured organization from Stage 1 in place, add targeted new examples:

| New Example | Target Tab | Corresponding Doc | Priority |
|-------------|-----------|-------------------|----------|
| **Persistence** | Patterns | `persistence/` — `@persist`, `persistWith`, provider options | High — widely used pattern |
| **ViewManager** | Patterns | `cmp/viewmanager/` — saved views on a grid, sharing, pinning | High — feature-rich, well-documented |
| **Store & Data** | Patterns or new top-level | `data/` — Store creation, Field types, filtering, RecordAction | High — foundational concept |
| **Theming & Dark Mode** | Components | `appcontainer/` — theme switching, CSS variable overrides | Medium |
| **App Lifecycle** | Patterns | `lifecycle-app/`, `lifecycle-models-and-services/` — visualize init/load/refresh | Medium — educational |
| **Authorization** | Patterns | `authorization/` — gates, role checks, conditional rendering | Medium |

### What This Achieves

1. **Tab names match doc package names** — users reading Grid docs find the Grids tab; persistence docs map to Patterns > Persistence
2. **"Other" disappears** — no more catch-all; everything has a logical home
3. **Bidirectional navigation** — docs link to examples, examples link to docs
4. **Incremental delivery** — Stage 1 is reorganization; Stage 2 fills gaps with new content
5. **Scalable structure** — new docs/examples have an obvious place to land
6. **Better first impression** — the tab hierarchy itself communicates Hoist's capabilities and how they're organized
