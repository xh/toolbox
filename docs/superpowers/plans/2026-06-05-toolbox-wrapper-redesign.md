# Toolbox Desktop `Wrapper` Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the desktop `Wrapper`'s full-width intro band + corner links dock with a fixed-width, collapsible left **info rail** that unifies title, intro text, and links, and remove the redundant breadcrumb titles from all 52 demo tabs.

**Architecture:** `Wrapper` becomes an `hframe` of a left info-rail `panel` (title + icon header, scrolling body with intro + a Resources list) and a flexible demo region. Rail collapse is driven by a single persisted observable on `AppModel` (deliberate exception to Hoist's `PanelModel` collapse — see spec). The `description`/`links` props are unchanged; new `title`/`icon` props move the per-tab title out of the demo panel and into the rail.

**Tech Stack:** TypeScript, React 18, MobX, `@xh/hoist` (hoistCmp factories, element factories, `@bindable`/`@persist`), SCSS with `--xh-*` theme tokens, Grails/Groovy for the server-side preference seed.

**Spec:** `docs/superpowers/specs/2026-06-05-toolbox-wrapper-redesign-design.md`

**Branch:** `wrapper-redesign` (already created; the design spec is committed there).

---

## Notes on testing in this codebase

These are UI components in a Hoist desktop app with **no automated component-test harness**. "Verify" steps therefore use:
- **TypeScript compile**: `cd client-app && yarn tsc --noEmit` (the pre-commit hook runs `tsc` too).
- **Lint**: `cd client-app && yarn lint:code`.
- **Visual check**: the dev servers (`./gradlew bootRun` at repo root + `cd client-app && yarn start`) at `http://localhost:3000/app`. The reviewer drives the browser.

Run the dev servers once now and leave them running; webpack hot-reloads on save.

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `client-app/src/desktop/common/Wrapper.ts` | The rail + demo layout, new props, collapse wiring | Rewrite |
| `client-app/src/desktop/common/Wrapper.scss` | Rail/demo/resources styling, token-driven | Rewrite |
| `client-app/src/desktop/AppModel.ts` | Holds the persisted `wrapperRailCollapsed` observable; drops the obsolete app option | Modify |
| `grails-app/init/io/xh/toolbox/BootStrap.groovy` | Seeds the `wrapperRailCollapsed` preference | Modify |
| `client-app/src/desktop/tabs/**` (52 files) | Lift title/icon to `wrapper(...)`, drop redundant breadcrumb titles | Modify |
| `CHANGELOG.md` | Record the change | Modify |

---

## Task 1: Seed the `wrapperRailCollapsed` preference (server)

**Files:**
- Modify: `grails-app/init/io/xh/toolbox/BootStrap.groovy:283-289`

- [ ] **Step 1: Replace the `expandDockedLinks` PreferenceSpec**

Replace this block (currently around lines 283–289):

```groovy
            new PreferenceSpec(
                name: 'expandDockedLinks',
                type: 'bool',
                defaultValue: false,
                groupName: 'Toolbox',
                notes: 'True to expand the docked linked panel by default, false to start collapsed.'
            ),
```

with:

```groovy
            new PreferenceSpec(
                name: 'wrapperRailCollapsed',
                type: 'bool',
                defaultValue: false,
                groupName: 'Toolbox',
                notes: 'True to collapse the Wrapper info rail (title/intro/links) shown on component demo tabs. Persists globally across tabs.'
            ),
```

- [ ] **Step 2: Verify the server still boots**

If `./gradlew bootRun` is running, confirm it hot-reloads without error (watch `/tmp/tb-backend.log` or the console). Otherwise this is checked when the app next starts. The pref is created on bootstrap; the old `expandDockedLinks` pref row in the DB becomes orphaned and harmless.

- [ ] **Step 3: Commit**

```bash
git add grails-app/init/io/xh/toolbox/BootStrap.groovy
git commit -m "Replace expandDockedLinks pref with wrapperRailCollapsed"
```

---

## Task 2: Add the `wrapperRailCollapsed` observable to `AppModel` and drop the app option

**Files:**
- Modify: `client-app/src/desktop/AppModel.ts` (imports near lines 1–13; class body around line 82; `getAppOptions()` around lines 112–125)

- [ ] **Step 1: Add the needed imports**

The file currently imports (line 3):
```typescript
import {InitContext, LoadSpec, managed, XH} from '@xh/hoist/core';
```
Change it to add `persist`:
```typescript
import {InitContext, LoadSpec, managed, persist, XH} from '@xh/hoist/core';
```

The file currently imports (line 12):
```typescript
import {runInAction} from '@xh/hoist/mobx';
```
Change it to add `bindable` and `makeObservable`:
```typescript
import {bindable, makeObservable, runInAction} from '@xh/hoist/mobx';
```

- [ ] **Step 2: Add the persisted observable + constructor to the class**

Immediately after the class declaration line `export class AppModel extends BaseAppModel {` (line 82) and its existing `static instance: AppModel;` (lines 83–84), add:

```typescript
    override persistWith = {prefKey: 'wrapperRailCollapsed'};

    /** Global, persisted collapse state for the Wrapper info rail on component demo tabs. */
    @bindable @persist
    wrapperRailCollapsed = false;

    constructor() {
        super();
        makeObservable(this);
    }
```

(`BaseAppModel` calls `makeObservable(this)` for its own observables; this subclass must call it again for `wrapperRailCollapsed`. `@bindable` generates the action-wrapped `setWrapperRailCollapsed` setter used by the Wrapper.)

- [ ] **Step 3: Remove the obsolete `expandDockedLinks` app option**

In `getAppOptions()`, delete this entry (currently lines 117–125):

```typescript
            {
                name: 'expandDockedLinks',
                prefName: 'expandDockedLinks',
                formField: {
                    label: 'Expand Links',
                    info: 'Always expand the docked Links panel when available.',
                    item: switchInput()
                }
            },
```

If `switchInput` (imported at line 9) is no longer referenced anywhere else in the file after this deletion, remove it from the import on line 9 as well. **Check first:** `grep -n switchInput client-app/src/desktop/AppModel.ts` — only remove the import if there are no remaining usages.

- [ ] **Step 4: Verify compile + lint**

```bash
cd client-app && yarn tsc --noEmit && yarn lint:code
```
Expected: no errors. (If `tsc` reports an unused `switchInput`, complete Step 3's import cleanup.)

- [ ] **Step 5: Commit**

```bash
git add client-app/src/desktop/AppModel.ts
git commit -m "Add persisted wrapperRailCollapsed observable; remove Expand Links app option"
```

---

## Task 3: Rewrite `Wrapper.ts`

**Files:**
- Modify (full replace): `client-app/src/desktop/common/Wrapper.ts`

Note: `title` is **optional** in this task so the 52 not-yet-migrated tabs keep compiling. It is made **required** in the final task (Task 11), which then doubles as a completeness check.

- [ ] **Step 1: Replace the entire file with this implementation**

```typescript
import {div, hframe, vbox, vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import {ReactElement, ReactNode} from 'react';
import {toolboxLink, ToolboxLinkProps} from '../../core/cmp/ToolboxLink';
import type {AppModel} from '../AppModel';
import './Wrapper.scss';

export interface WrapperProps extends HoistProps {
    /** Component/pattern name shown in the info rail header. */
    title?: ReactNode;

    /** Optional icon shown beside the title in the info rail header. */
    icon?: ReactElement;

    /** Intro text or description for the Component/pattern demo'd by this tab. */
    description?: ReactNode;

    /**
     * Links to display for this tab, pointing either to relevant source code within XH
     * repos or to external sites. Provided as objects with `url` and optional `text` / `notes`.
     */
    links?: ToolboxLinkProps[];
}

/** A styled container used to wrap component examples within Toolbox. */
export const [Wrapper, wrapper] = hoistCmp.withFactory<WrapperProps>({
    displayName: 'Wrapper',
    className: 'tbox-wrapper',
    render({className, title, icon, description, links, children}) {
        const collapsed = (XH.appModel as AppModel).wrapperRailCollapsed;
        return hframe({
            className,
            items: [
                collapsed ? collapsedRail() : infoRail({title, icon, description, links}),
                vframe({className: 'tbox-wrapper__demo', items: children})
            ]
        });
    }
});

const infoRail = hoistCmp.factory<WrapperProps>({
    render({title, icon, description, links}) {
        return panel({
            className: 'tbox-wrapper__rail',
            title,
            icon,
            compactHeader: true,
            width: 320,
            headerItems: [
                button({
                    icon: Icon.chevronLeft(),
                    title: 'Collapse info panel',
                    onClick: () => (XH.appModel as AppModel).setWrapperRailCollapsed(true)
                })
            ],
            item: div({
                className: 'tbox-wrapper__rail-body',
                items: [
                    div({
                        className: 'tbox-wrapper__intro',
                        item: description,
                        omit: !description
                    }),
                    div({
                        className: 'tbox-wrapper__divider',
                        omit: !description || isEmpty(links)
                    }),
                    resources({links})
                ]
            })
        });
    }
});

const resources = hoistCmp.factory<WrapperProps>({
    render({links}) {
        if (isEmpty(links)) return null;
        return div({
            className: 'tbox-wrapper__resources',
            items: [
                div({className: 'tbox-wrapper__resources-label', item: 'Resources'}),
                ...links.map(link =>
                    div({
                        className: 'tbox-wrapper__resource',
                        items: [
                            link.url.startsWith('http') ? Icon.openExternal() : Icon.code(),
                            div({
                                className: 'tbox-wrapper__resource-text',
                                items: [
                                    toolboxLink(link),
                                    div({
                                        className: 'tbox-wrapper__resource-note',
                                        item: link.notes,
                                        omit: !link.notes
                                    })
                                ]
                            })
                        ]
                    })
                )
            ]
        });
    }
});

const collapsedRail = hoistCmp.factory({
    render() {
        return vbox({
            className: 'tbox-wrapper__rail-collapsed',
            item: button({
                icon: Icon.chevronRight(),
                title: 'Show info panel',
                onClick: () => (XH.appModel as AppModel).setWrapperRailCollapsed(false)
            })
        });
    }
});
```

- [ ] **Step 2: Verify compile**

```bash
cd client-app && yarn tsc --noEmit
```
Expected: PASS. (Existing tabs pass `description`/`links` and no `title`; `title` is optional so they still compile. They render with an empty rail title for now — fixed during migration.)

- [ ] **Step 3: Verify the generated setter name**

Confirm `setWrapperRailCollapsed` is what `@bindable wrapperRailCollapsed` produces — `tsc` in Step 2 will error if the method name is wrong. If `tsc` flags `setWrapperRailCollapsed` as nonexistent, replace both call sites with `(XH.appModel as AppModel).setBindable('wrapperRailCollapsed', true)` / `(..., false)` (the `setBindable` helper on `HoistBase` works for any bindable). Re-run Step 2.

- [ ] **Step 4: Commit**

```bash
git add client-app/src/desktop/common/Wrapper.ts
git commit -m "Rewrite Wrapper as collapsible left info rail + demo region"
```

---

## Task 4: Rewrite `Wrapper.scss`

**Files:**
- Modify (full replace): `client-app/src/desktop/common/Wrapper.scss`

- [ ] **Step 1: Replace the entire file with this stylesheet**

```scss
.tbox-wrapper {
  gap: var(--xh-pad-px);
  padding: var(--xh-pad-px);

  // Fixed-width info rail — constant silhouette across tabs.
  &__rail {
    flex: none;
  }

  &__rail-body {
    overflow: auto;
    padding: var(--xh-pad-px);
    display: flex;
    flex-direction: column;
    gap: var(--xh-pad-px);
    line-height: 1.5;
  }

  &__intro {
    color: var(--xh-text-color-muted);

    p {
      margin: 0 0 var(--xh-pad-half-px);
      &:last-child {
        margin: 0;
      }
    }

    code {
      font-family: var(--xh-font-family-mono);
      font-size: 0.85em;
      color: var(--xh-text-color);
      background-color: var(--xh-bg-alt);
      padding: 1px 3px;
      border-radius: 3px;
    }
  }

  &__divider {
    flex: none;
    height: 1px;
    background: var(--xh-border-color);
  }

  &__resources {
    display: flex;
    flex-direction: column;
    gap: var(--xh-pad-half-px);
  }

  &__resources-label {
    margin-bottom: var(--xh-pad-half-px);
    text-transform: uppercase;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.09em;
    color: var(--xh-text-color-muted);
  }

  &__resource {
    display: flex;
    gap: var(--xh-pad-half-px);
    align-items: baseline;

    .xh-icon {
      flex: none;
      font-size: 0.85em;
      color: var(--xh-text-color-muted);
    }
  }

  &__resource-note {
    color: var(--xh-text-color-muted);
    font-size: 0.9em;
    line-height: 1.35;
  }

  // Flexible demo region — centers intrinsically-sized demos, no gradient.
  &__demo {
    flex: 1;
    min-width: 0;
    justify-content: center;
    align-items: center;
    padding: var(--xh-pad-double-px);

    > .xh-panel {
      border: var(--xh-border-solid);
    }
  }

  // Thin strip shown when the rail is collapsed.
  &__rail-collapsed {
    flex: none;
    align-items: center;
    padding-top: var(--xh-pad-px);
    border-right: var(--xh-border-solid);
  }
}
```

- [ ] **Step 2: Verify styles lint**

```bash
cd client-app && yarn lint:styles
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add client-app/src/desktop/common/Wrapper.scss
git commit -m "Restyle Wrapper for info rail + demo region (token-driven)"
```

---

## Task 5: Visual smoke test before migration

**Files:** none (browser only)

- [ ] **Step 1: Confirm the dev servers are up**

```bash
curl -s -o /dev/null -w "frontend:%{http_code} " http://localhost:3000/app; curl -s -o /dev/null -w "backend:%{http_code}\n" http://localhost:8080/ping
```
Expected: `frontend:200 backend:200`. If not, start them (servers section at top).

- [ ] **Step 2: Load and eyeball pre-migration state**

Open `http://localhost:3000/app/grids/standard`. Expected at this stage:
- A left rail panel is present with the intro text (readable, ~320px) and a **Resources** list with notes. Rail header has a collapse chevron but **no title yet** (title not migrated).
- The grid demo renders to the right; it still shows its old inner "Grids › Standard" title (removed during migration).
- Clicking the chevron collapses the rail to a thin strip with an expand chevron; clicking that restores it. Reload the page — the collapsed/expanded state **persists**.

This confirms the rail, resources, collapse, and persistence all work before touching the 52 tabs. No commit (no file changes).

---

## Migration tasks (6–10): lift title/icon, remove redundant breadcrumb titles

### The migration recipe (applies to every tab file)

For each file, edit the `wrapper({...})` call and the demo panel it wraps:

1. **Add `title` and `icon` to the `wrapper({...})` call** using the friendly name + icon from the table below. Place them as the first keys, before `description`.
2. **Remove the redundant title from the demo panel.** There are three cases:
   - **(b) Breadcrumb title** (contains `›` or `>`, e.g. `'Grids › Standard'`): delete the `title:` and its `icon:` from that demo panel.
   - **(a) Clean single title** (e.g. `'Hoist Inspector'`, `'Simple TreeMap'`): delete the `title:` and `icon:` from that demo panel (it's now in the rail).
   - **(c) No single outer title** (the demo is composed of multiple titled sub-panels, or has no title): add the new `title`/`icon` to the wrapper only. **Keep** the sub-panel titles (they label distinct regions and are not redundant).
3. Leave `description`, `links`, `item`/`items`, `className`, `tbar`, `headerItems`, etc. untouched.

**Do not** remove meaningful sub-panel titles (e.g. "Function + Options", "Input › Output", "Options", "Source Text"). Only the redundant outer/breadcrumb title goes.

### Worked example — case (b), `grids/StandardGridPanel.ts`

Before:
```typescript
    wrapper({
        description: [ /* … */ ],
        links: [ /* … */ ],
        item: panel({
            title: 'Grids › Standard',
            icon: Icon.gridPanel(),
            className: 'tb-grid-wrapper-panel',
            item: sampleGrid()
        })
    })
```
After:
```typescript
    wrapper({
        title: 'Standard Grid',
        icon: Icon.gridPanel(),
        description: [ /* … */ ],
        links: [ /* … */ ],
        item: panel({
            className: 'tb-grid-wrapper-panel',
            item: sampleGrid()
        })
    })
```

### Worked example — case (b) with meaningful sub-panels, `other/formats/NumberFormatsPanel.ts`

Before:
```typescript
        return wrapper({
            description: [ /* … */ ],
            item: panel({
                title: 'Other › Format Numbers',
                icon: Icon.print(),
                className: 'tbox-formats-tab',
                contentBoxProps: {flexDirection: 'row', padding: true, gap: true},
                items: [paramsPanel(), resultsPanel({ /* … */ })]
            })
        });
```
After (the outer panel loses its breadcrumb title/icon; the inner `paramsPanel`/`resultsPanel` titles like "Function + Options" / "Input › Output" stay as they are):
```typescript
        return wrapper({
            title: 'Format Numbers',
            icon: Icon.print(),
            description: [ /* … */ ],
            item: panel({
                className: 'tbox-formats-tab',
                contentBoxProps: {flexDirection: 'row', padding: true, gap: true},
                items: [paramsPanel(), resultsPanel({ /* … */ })]
            })
        });
```

### Worked example — case (c), `other/Buttons.ts`

The demo has no single outer breadcrumb title (it's a set of `Intent: …` sub-panels). Add title/icon to the wrapper only; keep the sub-panel titles.
```typescript
        return wrapper({
            title: 'Buttons',
            icon: Icon.checkCircle(),
            description: [ /* … */ ],
            links: [ /* … */ ],
            item: /* … unchanged … */
        });
```

### Friendly-name + icon table (all 52 files)

`case`: (a) clean title to remove, (b) breadcrumb title to remove, (c) no outer title — add to wrapper only.

**Task 6 — Grids (11 files)** under `client-app/src/desktop/tabs/grids/`:

| File | `title` | `icon` | case |
|---|---|---|---|
| `StandardGridPanel.ts` | `'Standard Grid'` | `Icon.gridPanel()` | b |
| `TreeGridPanel.ts` | `'Tree Grid'` | `Icon.grid()` | b |
| `TreeGridWithCheckboxPanel.ts` | `'Tree Grid with Checkboxes'` | `Icon.grid()` | b |
| `ColumnFilteringPanel.ts` | `'Column Filtering'` | `Icon.filter()` | b |
| `ColumnGroupsGridPanel.ts` | `'Grouped Columns'` | `Icon.gridPanel()` | b |
| `DataViewPanel.ts` | `'DataView'` | `Icon.addressCard()` | b |
| `ExternalSortGridPanel.ts` | `'External Sort'` | `Icon.gridPanel()` | b |
| `InlineEditingPanel.ts` | `'Inline Editing'` | `Icon.edit()` | b |
| `RestGridPanel.ts` | `'REST Editor'` | `Icon.edit()` | b |
| `ZoneGridPanel.ts` | `'Zone Grid'` | `Icon.gridLarge()` | b |
| `AgGridView.ts` | `'ag-Grid Wrapper'` | `Icon.gridPanel()` | b |

**Task 7 — Charts (3 files)** under `client-app/src/desktop/tabs/charts/`:

| File | `title` | `icon` | case |
|---|---|---|---|
| `LineChartPanel.ts` | `'Line Chart'` | `Icon.chartLine()` | b |
| `OHLCChartPanel.ts` | `'OHLC Chart'` | `Icon.chartLine()` | b |
| `SimpleTreeMapPanel.ts` | `'Simple TreeMap'` | `Icon.gridLarge()` | a |

(Note: `GridTreeMapPanel.ts` and `SplitTreeMapPanel.ts` in this directory do **not** use `wrapper` — leave them alone.)

**Task 8 — Forms (5 files)** under `client-app/src/desktop/tabs/forms/`:

| File | `title` | `icon` | case |
|---|---|---|---|
| `FormPanel.ts` | `'FormModel'` | `Icon.edit()` | b |
| `InputsPanel.ts` | `'HoistInputs'` | `Icon.edit()` | b |
| `PickerPanel.ts` | `'Picker'` | `Icon.list()` | b |
| `SelectPanel.ts` | `'Select'` | `Icon.list()` | b |
| `ToolbarFormPanel.ts` | `'Toolbar Form'` | `Icon.edit()` | b |

**Task 9 — Layout (8 files)** under `client-app/src/desktop/tabs/layout/`:

| File | `title` | `icon` | case |
|---|---|---|---|
| `CardPanel.ts` | `'Card'` | `Icon.addressCard()` | b |
| `HBoxContainerPanel.ts` | `'HBox'` | `Icon.box()` | b |
| `VBoxContainerPanel.ts` | `'VBox'` | `Icon.box()` | b |
| `TileFrameContainerPanel.ts` | `'TileFrame'` | `Icon.gridLarge()` | b |
| `dashCanvas/DashCanvasPanel.ts` | `'DashCanvas'` | `Icon.layout()` | b |
| `dashContainer/DashContainerPanel.ts` | `'Dash Container'` | `Icon.layout()` | b |
| `tabContainer/TabPanelContainerPanel.ts` | `'Tabs'` | `Icon.tab()` | b |
| `DockContainerPanel.ts` | `'Dock Container'` | `Icon.gridPanel()` | c |

**Task 10 — Panels (5 files)** under `client-app/src/desktop/tabs/panels/`:

| File | `title` | `icon` | case |
|---|---|---|---|
| `BasicPanel.ts` | `'Intro'` | `Icon.window()` | b |
| `LoadingIndicatorPanel.ts` | `'Loading Indicator'` | `Icon.spinner()` | b |
| `MaskPanel.ts` | `'Mask'` | `Icon.mask({prefix: 'fas'})` | b |
| `PanelSizingPanel.ts` | `'Panel Sizing'` | `Icon.window()` | b |
| `ToolbarPanel.ts` | `'Toolbar'` | `Icon.add()` | b |

**Task 11 — Other / Mobile (20 files)** under `client-app/src/desktop/tabs/other/` and `tabs/mobile/`:

| File | `title` | `icon` | case |
|---|---|---|---|
| `ClockPanel.ts` | `'Clock'` | `Icon.clock()` | b |
| `ErrorMessagePanel.ts` | `'Error Message'` | `Icon.skull()` | b |
| `FileChooserPanel.ts` | `'FileChooser'` | `Icon.copy()` | b |
| `LeftRightChooserPanel.ts` | `'LeftRightChooser'` | `Icon.arrowsLeftRight()` | b |
| `PinPadPanel.ts` | `'PinPad'` | `Icon.unlock()` | b |
| `PlaceholderPanel.ts` | `'Placeholder'` | `Icon.stop()` | b |
| `PopupsPanel.ts` | `'Popups'` | `Icon.comment()` | b |
| `formats/DateFormatsPanel.ts` | `'Format Dates'` | `Icon.print()` | b |
| `formats/NumberFormatsPanel.ts` | `'Format Numbers'` | `Icon.print()` | b |
| `relativetimestamp/RelativeTimestampPanel.ts` | `'Relative Timestamp'` | `Icon.clock()` | b |
| `exceptions/ExceptionHandlerPanel.ts` | `'Exception Handler'` | `Icon.skull()` | b (uses `>` not `›`) |
| `routing/SimpleRoutingPanel.ts` | `'Simple Routing'` | `Icon.gridPanel()` | a |
| `InspectorPanel.ts` | `'Inspector'` | `Icon.search()` | a |
| `IconsPanel.ts` | `'Icons'` | `Icon.icon({iconName: 'icons'})` | a |
| `MarkdownPanel.ts` | `'Markdown'` | `Icon.icon({prefix: 'fab', iconName: 'markdown'})` | c |
| `JsxPanel.tsx` | `'JSX'` | `Icon.code()` | c |
| `AppNotificationsPanel.ts` | `'App Notifications'` | `Icon.rocket()` | c |
| `Buttons.ts` | `'Buttons'` | `Icon.checkCircle()` | c |
| `CustomPackagePanel.ts` | `'Custom Package'` | `Icon.box()` | c (no existing icon; `Icon.box()` is a safe default) |
| `mobile/MobileTab.ts` | `'Mobile'` | `Icon.mobile()` | c |

> For every case (a)/(b) file: after adding to the wrapper, **delete** the `title:` and its sibling `icon:` from the demo panel that carried them. For case (c): only add to the wrapper; verify by opening the file that there is no single redundant outer title to remove (keep all sub-panel titles). The exact current title string to remove is whatever matches the table's leaf name / the `Section ›` form — confirm by reading the file.

### Per-batch task structure (do this for each of Tasks 6–11)

- [ ] **Step 1: Edit each file in the batch** per the recipe and the batch's table rows.
- [ ] **Step 2: Verify compile + lint for the batch**

```bash
cd client-app && yarn tsc --noEmit && yarn lint:code
```
Expected: PASS.

- [ ] **Step 3: Spot-check two tabs from the batch in the browser**

Navigate to two of the batch's routes (e.g. for Grids: `/app/grids/standard` and `/app/grids/tree`). Confirm the rail header now shows the friendly title + icon, and the demo panel no longer shows the old breadcrumb title (but keeps any meaningful sub-panel titles).

- [ ] **Step 4: Commit the batch**

```bash
git add client-app/src/desktop/tabs/<batch-dir>
git commit -m "Migrate <batch> tabs to Wrapper title/icon props"
```
(e.g. `git commit -m "Migrate grids tabs to Wrapper title/icon props"`)

---

## Task 12: Make `title` required, finalize, and verify

**Files:**
- Modify: `client-app/src/desktop/common/Wrapper.ts`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Make `title` required**

In `Wrapper.ts`, change:
```typescript
    /** Component/pattern name shown in the info rail header. */
    title?: ReactNode;
```
to:
```typescript
    /** Component/pattern name shown in the info rail header. */
    title: ReactNode;
```

- [ ] **Step 2: Run the compiler as a completeness check**

```bash
cd client-app && yarn tsc --noEmit
```
Expected: PASS. **Any error of the form "Property 'title' is missing" pinpoints a tab that was not migrated** — go migrate it (per the recipe + table), then re-run until clean. This is the guarantee that all 52 tabs were covered.

- [ ] **Step 3: Full lint**

```bash
cd client-app && yarn lint
```
Expected: PASS.

- [ ] **Step 4: Visual verification across the range (both themes)**

In the browser, visit: `/app/grids/standard` (grid + its own options sidebar), a chart (`/app/charts/line`), a form (`/app/forms/hoistInputs`), the no-links tab (`/app/other/formatNumbers`), and a tiny-demo tab (`/app/other/clock`). Confirm for each:
- Constant rail width/position; readable intro; Resources list with notes; Resources omitted on no-link tabs.
- Friendly rail title + icon present; no leftover breadcrumb title on the demo; meaningful sub-panel titles retained.
- Small demos (Clock) center cleanly with no gradient artifacts; grids/charts fill as before.

Toggle the rail collapse chevron and reload — collapsed state persists and applies on every tab. Toggle light/dark theme (top-right avatar menu → Options, or the theme toggle) — both render correctly.

- [ ] **Step 5: Add a CHANGELOG entry**

Open `CHANGELOG.md`. Under the topmost `## 9.0-SNAPSHOT - unreleased` heading (confirm it is the top, unreleased version; if the top version is already released, add a new `## 9.0-SNAPSHOT - unreleased` heading first per repo conventions), add under a `### Technical` section (create it if absent) — as a **single line**:

```
* Redesigned the desktop component-demo `Wrapper`: intro text and reference links are now unified into a single collapsible left info rail (replacing the full-width intro band and the orphaned corner links dock), and redundant breadcrumb titles were removed from demo panels.
```

- [ ] **Step 6: Commit**

```bash
git add client-app/src/desktop/common/Wrapper.ts CHANGELOG.md
git commit -m "Require Wrapper title; add changelog entry for Wrapper redesign"
```

- [ ] **Step 7: Final full-suite check**

```bash
cd client-app && yarn tsc --noEmit && yarn lint
```
Expected: PASS. The feature branch `wrapper-redesign` is now ready for a PR into `develop`.

---

## Done criteria

- Every component demo tab shows the fixed-width info rail (title + icon + readable intro + Resources-with-notes) on the left and its demo on the right; no full-width intro band, no corner links dock, no redundant breadcrumb demo-panel titles.
- The rail collapses/expands via the header chevron; the state persists across reloads and is shared across all tabs.
- Light and dark themes both render correctly.
- `yarn tsc --noEmit` and `yarn lint` both pass; `title` is a required prop.
