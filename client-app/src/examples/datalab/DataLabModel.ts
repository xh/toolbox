import {FormModel} from '@xh/hoist/cmp/form';
import {GridModel} from '@xh/hoist/cmp/grid';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {
    BaselineAdapter,
    DEFAULT_PROTOCOL,
    MeasurementHarness,
    numberIs,
    required,
    RunResult,
    ScenarioConfig
} from '@xh/hoist/data';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {round} from 'lodash';
import {HttpIngestAdapter} from './ingest/HttpIngestAdapter';
import {WebSocketIngestAdapter} from './ingest/WebSocketIngestAdapter';

/** A persisted run: the RunResult plus a user-facing label/timestamp for the run-history view. */
export interface SavedRun {
    label: string;
    savedAt: string;
    result: RunResult;
}

/** Sensible starter scenario - editable in the UI and overwritten when a saved profile loads. */
function defaultScenario(): ScenarioConfig {
    return {
        name: 'Default Scenario',
        dataset: {
            leafRowCount: 50000,
            dimensions: ['dim0', 'dim1', 'dim2'],
            fieldCount: 10,
            fieldTypeMix: {number: 5, string: 3, date: 1, object: 1},
            aggregators: [],
            seed: 0
        },
        update: {
            pattern: 'steadyTrickle',
            breadth: 1,
            batchSize: 10,
            ratePerSec: 10,
            transport: 'http',
            durationSec: 5
        },
        protocol: {...DEFAULT_PROTOCOL}
    };
}

/**
 * Drives the framework {@link MeasurementHarness} for the Data Lab Toolbox example.
 *
 * Responsibilities (the integration seam with the endpoint-agnostic harness core, 02-05):
 *  - Holds an editable {@link ScenarioConfig} (the 02-01 knobs), bound to Hoist inputs in the panel.
 *  - OWNS THE TRANSPORT: pre-fetches the snapshot over the chosen transport (HTTP or WebSocket,
 *    Task 1 adapters) and pre-loads it into a {@link BaselineAdapter} BEFORE running; supplies the
 *    injected per-iteration `nextBatchAsync` + calibration callbacks. The harness fetches nothing.
 *  - Persists named scenario profiles and completed run scorecards as JsonBlobs via two
 *    {@link ViewManagerModel}s ("profiles and runs are data, not code").
 *  - Computes side-by-side deltas / percent change between two selected saved runs.
 *
 * The live grid (`adapter.gridModel`) is exposed so the panel can MOUNT it - mounting populates
 * `agApi`, which is what makes the harness's `bridgeCall` (applyTransaction) measurement reflect the
 * real JS-to-AG-Grid crossing rather than call overhead alone (see 02-05 seam limitation).
 */
export class DataLabModel extends HoistModel {
    /** Scenario VM: named, shareable scenario-config profiles. */
    scenarioViewManager: ViewManagerModel;
    /** Run-history VM: each completed run persisted as a named scorecard. */
    runViewManager: ViewManagerModel;

    /**
     * The editable scenario knobs. Field values persist to / restore from named profiles natively
     * via the scenario {@link ViewManagerModel} (see `persistWith` below) - selecting a saved view
     * re-applies its values, and the ViewManager's own Save / Save As controls capture them. The
     * full {@link ScenarioConfig} handed to the harness is derived from these fields (see `scenario`).
     */
    @managed scenarioForm: FormModel;

    /** The live baseline adapter for the current/last run - its gridModel is mounted by the panel. */
    @managed @observable.ref adapter: BaselineAdapter = null;

    /** The grid the panel mounts so `agApi` is live during a run (drives a non-trivial bridgeCall). */
    get gridModel(): GridModel {
        return this.adapter?.gridModel ?? null;
    }

    /** Result of the most recent run, shown on the scorecard. */
    @observable.ref lastResult: RunResult = null;

    /** Runs accumulated this session (also persisted via the run-history VM). */
    @observable.ref savedRuns: SavedRun[] = [];

    /** The two saved runs selected for side-by-side comparison (by label). */
    @bindable.ref compareLabels: string[] = [];

    @bindable running = false;
    @bindable statusText: string = null;

    /** Grid for the side-by-side comparison; reloaded from {@link comparisonRows} via reaction. */
    @managed comparisonGridModel: GridModel;

    constructor() {
        super();
        makeObservable(this);
        // The two ViewManagers are created at app level (see AppModel.initAsync) so their saved
        // views load before this model is constructed - the same placement Portfolio uses.
        const appModel = XH.appModel as unknown as {
            scenarioViewManager: ViewManagerModel;
            runViewManager: ViewManagerModel;
        };
        this.scenarioViewManager = appModel.scenarioViewManager;
        this.runViewManager = appModel.runViewManager;

        // Editable knobs as a validated FormModel. Persisting via the scenario ViewManager makes
        // saved profiles a native concern: the framework applies a selected view's values to these
        // fields and harvests them on save - no manual blob read/write.
        const d = defaultScenario();
        this.scenarioForm = new FormModel({
            persistWith: {viewManagerModel: this.scenarioViewManager},
            fields: [
                {
                    name: 'leafRowCount',
                    displayName: 'Leaf rows',
                    initialValue: d.dataset.leafRowCount,
                    rules: [required, numberIs({min: 1})]
                },
                {
                    name: 'dimensionCount',
                    displayName: 'Dimensions',
                    initialValue: d.dataset.dimensions.length,
                    rules: [required, numberIs({min: 0})]
                },
                {
                    name: 'fieldCount',
                    displayName: 'Fields',
                    initialValue: d.dataset.fieldCount,
                    rules: [required, numberIs({min: 1})]
                },
                {
                    name: 'pattern',
                    displayName: 'Update pattern',
                    initialValue: d.update.pattern
                },
                {
                    name: 'transport',
                    displayName: 'Transport',
                    initialValue: d.update.transport
                },
                {
                    name: 'batchSize',
                    displayName: 'Batch size',
                    initialValue: d.update.batchSize,
                    rules: [required, numberIs({min: 1})]
                },
                {
                    name: 'breadth',
                    displayName: 'Update breadth',
                    initialValue: d.update.breadth,
                    rules: [required, numberIs({min: 1})]
                }
            ]
        });

        this.comparisonGridModel = new GridModel({
            store: {idSpec: 'id'},
            emptyText: 'Select two saved runs to compare',
            columns: [
                {field: 'metric', width: 220},
                {field: 'runA', headerName: 'Run A', width: 130, align: 'right'},
                {field: 'runB', headerName: 'Run B', width: 130, align: 'right'},
                {field: 'delta', headerName: 'Delta', width: 130, align: 'right'},
                {
                    field: 'pct',
                    headerName: '% Change',
                    width: 110,
                    align: 'right',
                    renderer: v => (v == null ? '-' : `${v}%`)
                }
            ]
        });

        // Keep the comparison grid in sync with the current selection.
        this.addReaction({
            track: () => this.comparisonRows,
            run: rows => this.comparisonGridModel.loadData(rows),
            fireImmediately: true
        });

        // Note: selecting a saved scenario profile re-applies its values to `scenarioForm`
        // automatically via the registered ViewManager persistence provider - no reaction needed.

        // Hydrate any persisted run history from the active run-history view.
        this.addReaction({
            track: () => this.runViewManager.view,
            run: () => this.syncRunsFromView(),
            fireImmediately: true
        });
    }

    //------------------------------------------------------------------------------------------------
    // Scenario - the full config handed to the harness, derived from the editable form knobs
    //------------------------------------------------------------------------------------------------

    /**
     * The complete {@link ScenarioConfig} for a run, projected from the editable {@link scenarioForm}
     * over the fixed defaults (field-type mix, aggregators, seed, rate, protocol). `dimensionCount`
     * expands to a `dim0..dimN` array; the active profile's name (if any) labels the scenario.
     */
    @computed
    get scenario(): ScenarioConfig {
        const d = defaultScenario(),
            v = this.scenarioForm.values,
            dimCount = Math.max(0, v.dimensionCount ?? d.dataset.dimensions.length),
            dimensions = Array.from({length: dimCount}, (_, i) => `dim${i}`);
        return {
            ...d,
            name: this.scenarioViewManager.view?.name ?? d.name,
            dataset: {
                ...d.dataset,
                leafRowCount: v.leafRowCount,
                fieldCount: v.fieldCount,
                dimensions
            },
            update: {
                ...d.update,
                pattern: v.pattern,
                transport: v.transport,
                batchSize: v.batchSize,
                breadth: v.breadth
            }
        };
    }

    /**
     * Save the current knob values as a new named profile. The ViewManager harvests the registered
     * `scenarioForm` provider's state via `getValue()` - the form fields ARE the persisted value.
     */
    async saveScenarioAsAsync(name: string) {
        await this.scenarioViewManager.saveAsAsync({
            name,
            group: null,
            description: null,
            isShared: false,
            isGlobal: false,
            value: this.scenarioViewManager.getValue()
        });
    }

    //------------------------------------------------------------------------------------------------
    // Run - the integration seam with the endpoint-agnostic harness (02-05)
    //------------------------------------------------------------------------------------------------

    async runAsync() {
        if (this.running) return;
        this.running = true;
        this.statusText = 'Fetching snapshot...';

        const scenario = this.scenario,
            {dataset, update} = scenario;

        // 1. Select the ingest adapter per the transport knob (Task 1). The UI owns ALL fetch.
        const http = new HttpIngestAdapter(),
            ws = update.transport === 'webSocket' ? new WebSocketIngestAdapter() : null;

        // Fresh baseline adapter per run so each iteration starts from a clean pipeline/heap.
        const adapter = new BaselineAdapter({
            dimensions: dataset.dimensions,
            aggregators: dataset.aggregators?.length ? dataset.aggregators : null
        });

        try {
            // 2. PRE-FETCH the snapshot over the chosen transport and PRE-LOAD it into the adapter
            //    BEFORE handing the adapter to the harness (the harness verifies it is non-empty).
            const snapshotRows = ws
                ? await ws.loadSnapshotAsync(scenario)
                : await http.loadSnapshotAsync(scenario);
            await adapter.loadSnapshotAsync(snapshotRows);

            // Expose the adapter so the panel mounts adapter.gridModel -> populates agApi -> the
            // harness's bridgeCall (applyTransaction) reflects the real JS-to-AG-Grid crossing.
            this.setAdapter(adapter);
            this.statusText = 'Running scenario...';

            // 3. Build the injected per-iteration data-provider + heap-calibration callbacks. For WS
            //    the harness pulls each buffered/incoming pushed batch; for HTTP it polls the next
            //    deterministic diff. Calibration rows are pulled from the same transport.
            const nextBatchAsync = ws
                ? () => ws.nextBatchAsync()
                : () => http.nextDiffAsync(scenario);

            const calHttp = new HttpIngestAdapter();
            const loadNRowsAsync = async (n: number) => {
                const rows = await calHttp.loadSnapshotAsync({
                    ...scenario,
                    dataset: {...dataset, leafRowCount: n}
                });
                await adapter.loadSnapshotAsync(rows);
            };
            const clearAsync = async () => {
                await adapter.loadSnapshotAsync(snapshotRows);
            };

            // 4. Run the scenario through the endpoint-agnostic harness and persist the RunResult.
            const result = await new MeasurementHarness().runScenarioAsync({
                scenario,
                adapter,
                nextBatchAsync,
                loadNRowsAsync,
                clearAsync
            });

            this.setLastResult(result);
            await this.persistRunAsync(result);
            this.statusText = 'Run complete.';
        } catch (e) {
            XH.handleException(e);
            this.statusText = 'Run failed.';
        } finally {
            if (ws) await ws.stopAsync();
            this.running = false;
        }
    }

    @action
    private setAdapter(adapter: BaselineAdapter) {
        this.adapter = adapter;
    }

    @action
    private setLastResult(result: RunResult) {
        this.lastResult = result;
    }

    //------------------------------------------------------------------------------------------------
    // Run persistence + comparison
    //------------------------------------------------------------------------------------------------

    private async persistRunAsync(result: RunResult) {
        const label = `${result.scenario.name} @ ${result.env.capturedAt}`,
            run: SavedRun = {label, savedAt: result.env.capturedAt, result};

        this.setSavedRuns([...this.savedRuns, run]);
        await this.runViewManager.saveAsAsync({
            name: label,
            group: null,
            description: null,
            isShared: false,
            isGlobal: false,
            value: {run} as PlainObject
        });
    }

    @action
    private setSavedRuns(runs: SavedRun[]) {
        this.savedRuns = runs;
    }

    private syncRunsFromView() {
        const value = this.runViewManager.view?.value as PlainObject;
        if (value?.run) {
            const run = value.run as SavedRun;
            if (!this.savedRuns.some(it => it.label === run.label)) {
                this.setSavedRuns([...this.savedRuns, run]);
            }
        }
    }

    /** The two runs currently selected for comparison, resolved from labels. */
    get comparedRuns(): SavedRun[] {
        return this.compareLabels
            .map(label => this.savedRuns.find(r => r.label === label))
            .filter(Boolean);
    }

    /**
     * Per-metric comparison of the two selected runs: absolute and percent delta of run B vs run A
     * (the baseline-vs-candidate / run-over-run mechanism). Returns one row per metric for a grid.
     */
    get comparisonRows(): PlainObject[] {
        const runs = this.comparedRuns;
        if (runs.length < 2) return [];

        const a = runs[0].result,
            b = runs[1].result,
            metrics: Array<[string, number, number]> = [
                ['Compute median (ms)', a.scorecard.compute.medianMs, b.scorecard.compute.medianMs],
                ['Compute p95 (ms)', a.scorecard.compute.p95Ms, b.scorecard.compute.p95Ms],
                [
                    'Bridge median (ms)',
                    a.scorecard.bridgeCall.medianMs,
                    b.scorecard.bridgeCall.medianMs
                ],
                ['Bridge p95 (ms)', a.scorecard.bridgeCall.p95Ms, b.scorecard.bridgeCall.p95Ms],
                ['Render median (ms)', a.scorecard.render.medianMs, b.scorecard.render.medianMs],
                [
                    'Heap total (bytes)',
                    a.scorecard.heap.totalHeapDelta,
                    b.scorecard.heap.totalHeapDelta
                ],
                [
                    'Cube records (bytes)',
                    a.scorecard.heap.cubeStoreRecords,
                    b.scorecard.heap.cubeStoreRecords
                ],
                [
                    'Grid records (bytes)',
                    a.scorecard.heap.gridStoreRecords,
                    b.scorecard.heap.gridStoreRecords
                ],
                [
                    'View rows (bytes)',
                    a.scorecard.heap.viewResultRows,
                    b.scorecard.heap.viewResultRows
                ],
                [
                    'AG Grid remainder (bytes)',
                    a.scorecard.heap.agGridInternals,
                    b.scorecard.heap.agGridInternals
                ],
                ['Leaf rows', a.scorecard.rowCounts.leaf, b.scorecard.rowCounts.leaf],
                ['Grid rows', a.scorecard.rowCounts.gridRows, b.scorecard.rowCounts.gridRows]
            ];

        return metrics.map(([metric, valA, valB], idx) => {
            const delta = valB - valA,
                pct = valA !== 0 ? round((delta / valA) * 100, 1) : null;
            return {id: idx, metric, runA: valA, runB: valB, delta, pct};
        });
    }

    //------------------------------------------------------------------------------------------------
    // Formatting helpers for the scorecard display
    //------------------------------------------------------------------------------------------------

    fmtMs(v: number): string {
        return v == null ? '-' : `${round(v, 3)} ms`;
    }

    fmtBytes(v: number): string {
        return v == null ? '-' : `${round(v).toLocaleString()} B`;
    }
}
