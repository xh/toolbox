# Toolbox "Playwright Host" Sub-App — Design Proposal

**Status:** Draft for review on 2026-05-21.
**Author:** Claude (overnight session 2026-05-20).
**Owner:** ATM.

## Goal

Make Toolbox the canonical, extensible E2E testing surface for `@xh/hoist`. Today's
`playwright/` directory covers full-app smoke tests of the desktop tab tree — that's good for
catching gross regressions but doesn't give us focused coverage of individual Hoist primitives
(Grid filtering chooser, DashCanvas widget round-trip, ViewManager persistence, Cube re-pivots,
etc.).

The proposal: add a new webpack entry point — `client-app/src/apps/playwrightHost.ts` — that
mounts a **registry of named test scenarios**. Each scenario is a small, self-contained
Hoist component/model pair that exercises a specific framework surface. Playwright drives this
host by navigating to `?scenario=<id>`, waiting for it to mount, and then running assertions
against the live Hoist runtime via the existing `HoistPage` helpers.

This pairs naturally with the existing example-app pattern in Toolbox (`contact`, `portfolio`,
`todo`, etc.) — same webpack discovery mechanism, same auth/init plumbing, just an entry point
purpose-built for automation.

## Why a separate sub-app

| Concern                                            | Why a dedicated host beats embedding in desktop app |
|----------------------------------------------------|------------------------------------------------------|
| **Isolation of scenarios**                         | Each scenario starts from a clean mount with deterministic state. Desktop tabs share AppModel + cross-cutting services, so resetting state between specs is hand-rolled. |
| **Fast page loads**                                | A minimal AppShell with no toolbar / tab tree / docked links / dashboard subscriptions makes per-spec setup substantially faster than booting the full desktop app. |
| **Stable URLs across scenarios**                   | `?scenario=grid-column-filter` is a stable, human-readable selector for any test. Desktop deeplinks would have to encode `tabId/subTab/...` and break on app navigation refactors. |
| **No cross-test interference**                     | A scenario can mutate Hoist services, push state into a Store, install reactions, etc., without leaking into other tests. Tearing it down is just unmounting the scenario component. |
| **Adoption ergonomics**                            | Adding a scenario should be a single-file PR (`scenarios/foo/FooScenario.ts` plus a one-line registration). Adding desktop tabs is heavier and crosses ownership lines. |
| **Doubles as a manual playground**                 | Devs hitting `localhost:3000/playwrightHost?scenario=...` get a focused, framework-only sandbox for the surface they're working on. Like Storybook, but model-aware. |

## Shape of a scenario

```ts
// client-app/src/apps/playwrightHost/scenarios/grid/columnFilteringScenario.ts
import {hoistCmp, HoistModel, managed, makeObservable} from '@xh/hoist/core';
import {GridModel, grid} from '@xh/hoist/cmp/grid';
import {Scenario, registerScenario} from '../../runtime';

class ColumnFilteringScenarioModel extends HoistModel {
    @managed gridModel: GridModel;

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = new GridModel({
            testId: 'scenarioGrid',
            columns: [
                {field: 'company', filterable: true},
                {field: 'sector', filterable: true},
                {field: 'pnl', filterable: true, align: 'right'}
            ],
            store: {
                data: [
                    {id: 1, company: 'Acme', sector: 'Tech', pnl: 1000},
                    {id: 2, company: 'Beta', sector: 'Tech', pnl: -250},
                    {id: 3, company: 'Gamma', sector: 'Energy', pnl: 4500}
                ]
            }
        });
    }
}

const columnFilteringScenario = hoistCmp.factory<ColumnFilteringScenarioModel>({
    model: ColumnFilteringScenarioModel,
    render: ({model}) => grid({model: model.gridModel, flex: 1})
});

registerScenario({
    id: 'grid-column-filter',
    title: 'Grid: Column Filter Chooser',
    description: 'Grid with filterable columns wired to a tiny in-memory Store.',
    component: columnFilteringScenario,
    tags: ['grid', 'filter']
});
```

The scenario registers itself via a side-effect on import. The host's webpack glob pulls in
every file matching `scenarios/**/*Scenario.ts` so adding one is a single-file PR.

## Host runtime

The host is a Hoist app like any other — `AppModel`, `AppComponent`, services. Its UI is a
two-pane shell:

- **Left rail (collapsible)** — list of registered scenarios grouped by tag, with a search box.
  Each entry links to `?scenario=<id>`. Hidden in automated runs via a `testId`-based class so it
  doesn't show up in screenshots.
- **Right pane** — the currently mounted scenario component. Switches when the `scenario` query
  param changes.

The `AppModel` exposes:

```ts
class PlaywrightHostModel extends BaseAppModel {
    @observable currentScenarioId: string | null = null;
    @bindable filterText = '';

    get scenarios(): Scenario[] { /* from runtime */ }
    get currentScenario(): Scenario | null { /* registry lookup */ }

    async loadScenarioAsync(id: string) { /* updates state + router */ }
}
```

This gives Playwright a stable navigation API:

```ts
test('grid column filter chooser opens', async ({admin}) => {
    await admin.loadScenario('grid-column-filter');     // navigates + waits for mount
    const grid = admin.createGridHelper('scenarioGrid');
    await grid.ensureRecordCount(3);
    // ... DOM-level interaction with the filter chooser
});
```

`loadScenario` lives on the Toolbox-side `ToolboxApp` fixture:

```ts
async loadScenario(id: string) {
    await this.page.goto(`/playwrightHost?scenario=${encodeURIComponent(id)}`);
    await this.waitForAppToBeRunning();
    await this.waitForMaskToClear();
    // Wait until the model's currentScenarioId matches — guards against route races.
    await expect.poll(() =>
        this.page.evaluate(() => (window.XH.appModel as any).currentScenarioId)
    ).toBe(id);
}
```

## Repository layout

```
client-app/src/
  apps/
    playwrightHost.ts                # webpack entry → renders PlaywrightHostApp
  playwrightHost/                    # all sub-app code lives here
    AppModel.ts                      # registry-aware tab model
    AppComponent.ts                  # two-pane shell
    runtime/
      Scenario.ts                    # public type definition
      registry.ts                    # registerScenario + getScenarios
      scenariosManifest.ts           # auto-generated import list (webpack require.context)
    scenarios/
      grid/
        columnFilteringScenario.ts
        treeGridScenario.ts
      form/
        validationScenario.ts
      dashCanvas/
        widgetRoundTripScenario.ts
      viewManager/
        persistRestoreScenario.ts
      ...
```

`scenariosManifest.ts` is a one-liner: `require.context('../scenarios', true, /Scenario\.ts$/)`.
Hoist projects already use this pattern (e.g. how Toolbox loads docs); no new tooling needed.

## Auth posture

The host runs under the same auth as the rest of Toolbox. When `OAUTH_PROVIDER=NONE`, the
existing Hoist login form gates entry; the cached storageState in `.auth/admin.json` works for
the host the same way it works for the desktop app. No new auth code.

Decision point: should the host require `HOIST_ADMIN`, or be open to any authenticated user? My
default would be **any authenticated user**, since the scenarios themselves don't expose privileged
data; admin-specific behaviour can be tested via the admin console app.

## Phasing

This is bigger than tonight. Suggested phases, each independently mergeable:

1. **Phase A — Host skeleton.** New entry point, empty registry, one trivial scenario
   (`hello-world`), Playwright fixture extension with `loadScenario`. Spec: navigate to the
   scenario, assert a known string renders. **Outcome:** prove the wiring end-to-end.
2. **Phase B — Grid scenarios pack.** 6–10 scenarios covering grid filtering, column chooser,
   tree, inline editing, zone grid, selection. Specs for each. **Outcome:** real value, real
   patterns to copy.
3. **Phase C — Form scenarios pack.** Form validation, field-level dirty/disabled tracking,
   bound select chooser, dynamic field disable. **Outcome:** FormHelper gets stretched.
4. **Phase D — Persistence + ViewManager.** Round-trip saves, restore, dirty detection,
   shared-view publishing. **Outcome:** flushes out the `@persist` decorator edge cases.
5. **Phase E — Cube / advanced grid pivots.** Multi-dimensional re-pivot from observable model
   changes. **Outcome:** model-driven coverage that pure DOM testing can't match.

## Open questions

1. **Reset between specs.** Hoist services are singletons. Do we need a "reset the host"
   affordance that destroys + reinstalls per-scenario services, or do we forbid scenario-scoped
   service mutation? Tentative answer: forbid service mutation, encourage local models — and
   add a `resetScenarioAsync()` API that re-instantiates the current scenario's local model.
2. **Where does the scenario registry live in TypeScript?** A side-effect register pattern is
   ergonomic but breaks tree-shaking. Alternative: an explicit `scenarios/index.ts` that
   imports + exports the registry. Likely fine since the host is a tiny bundle.
3. **CI matrix.** Should the same suite run against both `@xh/hoist` published vs. the inlined
   sibling checkout (`runHoistInline=true`)? Probably yes, but as a separate workflow.
4. **Should scenarios be co-located with the framework code they test?** I.e. lift the
   `@xh/hoist/cmp/grid` scenarios into hoist-react itself once the host pattern is proven.
   Long-term: yes — the host code stays in Toolbox but the scenarios travel with what they cover.
5. **Visual regression?** Out of scope for this proposal but worth a follow-up if we want
   `@playwright/test` screenshot diffing on a deterministic scenario set.
