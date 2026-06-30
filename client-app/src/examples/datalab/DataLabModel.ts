import {FormModel} from '@xh/hoist/cmp/form';
import {GridModel} from '@xh/hoist/cmp/grid';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {HoistModel, managed, persist, PlainObject, TaskObserver, XH} from '@xh/hoist/core';
import {
    BaselineAdapter,
    Constraint,
    DEFAULT_PROTOCOL,
    MeasurementHarness,
    MeasurementProgress,
    numberIs,
    required,
    RunResult,
    ScenarioConfig
} from '@xh/hoist/data';
import {fmtDateTimeSec} from '@xh/hoist/format';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {filesize} from 'filesize';
import {round} from 'lodash';
import {HttpIngestAdapter} from './ingest/HttpIngestAdapter';
import {WebSocketIngestAdapter} from './ingest/WebSocketIngestAdapter';

/** A persisted run: the RunResult plus a user-facing label/timestamp for the run-history view. */
export interface SavedRun {
    label: string;
    savedAt: string;
    result: RunResult;
}

/**
 * Cross-field rule on the two measurement-pass toggles: at least one pass must be enabled (a run
 * with neither has nothing to measure). Applied to both `measureMemory` and `measurePerformance` so
 * the error surfaces on whichever the user just cleared.
 */
const atLeastOnePass: Constraint = (_fieldState, allValues) => {
    if (!allValues.measureMemory && !allValues.measurePerformance) {
        return 'Enable at least one measurement pass (memory or performance).';
    }
    return null;
};

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
            cadence: 'steady',
            updateMode: 'incremental',
            breadth: 1,
            batchSize: 10,
            ratePerSec: 10,
            transport: 'http',
            durationSec: 5
        },
        protocol: {...DEFAULT_PROTOCOL},
        measure: {memory: true, performance: true}
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
 *  - Persists named, shareable scenario profiles via a {@link ViewManagerModel}; keeps run history
 *    as transient, localStorage-backed local state (`savedRuns`) - runs are not curated views.
 *  - Computes side-by-side deltas / percent change between two selected saved runs.
 *
 * The live grid (`adapter.gridModel`) is exposed so the panel can MOUNT it - mounting populates
 * `agApi`, which is what makes the harness's `bridgeCall` (applyTransaction) measurement reflect the
 * real JS-to-AG-Grid crossing rather than call overhead alone (see 02-05 seam limitation).
 */
export class DataLabModel extends HoistModel {
    /** Scenario VM: named, shareable scenario-config profiles. */
    scenarioViewManager: ViewManagerModel;

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

    /**
     * Run history - transient, un-named measurement records. These are NOT shared, curated, or
     * named views, so they are deliberately NOT a ViewManager concern; they persist to browser
     * localStorage purely so a tab refresh doesn't discard a session's runs. Cleared in bulk via
     * {@link clearSavedRunsAsync} when the history outgrows its usefulness.
     */
    @observable.ref
    @persist.with({localStorageKey: 'dataLab.savedRuns'})
    savedRuns: SavedRun[] = [];

    /** The two saved runs selected for side-by-side comparison (by label). */
    @bindable.ref compareLabels: string[] = [];

    /**
     * Drives the results-panel mask and surfaces coarse run status (the harness reports progress
     * through to its `message`, e.g. "Measuring 7 of 20"). `isPending` also gates the Run control,
     * so it is the single source of truth for "a run is in flight".
     */
    taskObserver = TaskObserver.trackLast();

    /** Grid for the side-by-side comparison; reloaded from {@link comparisonRows} via reaction. */
    @managed comparisonGridModel: GridModel;

    constructor() {
        super();
        makeObservable(this);
        // The scenario ViewManager is created at app level so its saved views are loaded before
        // this model is constructed; adopt it here.
        const appModel = XH.appModel as unknown as {
            scenarioViewManager: ViewManagerModel;
        };
        this.scenarioViewManager = appModel.scenarioViewManager;

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
                    name: 'cadence',
                    displayName: 'Cadence',
                    initialValue: d.update.cadence
                },
                {
                    name: 'updateMode',
                    displayName: 'Update mode',
                    initialValue: d.update.updateMode
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
                },
                {
                    name: 'measureMemory',
                    displayName: 'Measure memory',
                    initialValue: d.measure.memory,
                    rules: [atLeastOnePass]
                },
                {
                    name: 'measurePerformance',
                    displayName: 'Measure performance',
                    initialValue: d.measure.performance,
                    rules: [atLeastOnePass]
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
        // Run history (`savedRuns`) likewise hydrates itself from localStorage via @persist.
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
                cadence: v.cadence,
                updateMode: v.updateMode,
                transport: v.transport,
                batchSize: v.batchSize,
                breadth: v.breadth
            },
            measure: {memory: v.measureMemory, performance: v.measurePerformance}
        };
    }

    //------------------------------------------------------------------------------------------------
    // Run - the integration seam with the endpoint-agnostic harness (02-05)
    //------------------------------------------------------------------------------------------------

    // Mask + status are driven by `taskObserver`: linking the run makes it pending (mask shows), and
    // the harness's onProgress updates its message. `isPending` is also the re-entry guard.
    async runAsync() {
        if (this.taskObserver.isPending) return;
        // At least one measurement pass must be enabled - a run with neither has nothing to measure.
        if (!this.scenario.measure.memory && !this.scenario.measure.performance) {
            XH.dangerToast('Enable at least one measurement pass (memory or performance).');
            return;
        }
        await this.doRunAsync().linkTo(this.taskObserver);
    }

    private async doRunAsync() {
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
            this.taskObserver.setMessage('Fetching snapshot...');
            const snapshotRows = ws
                ? await ws.loadSnapshotAsync(scenario)
                : await http.loadSnapshotAsync(scenario);
            await adapter.loadSnapshotAsync(snapshotRows);

            // Expose the adapter so the panel mounts adapter.gridModel -> populates agApi -> the
            // harness's bridgeCall (applyTransaction) reflects the real JS-to-AG-Grid crossing.
            this.setAdapter(adapter);

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
            // Calibration teardown: empty the calibration rows to a TRUE-EMPTY pipeline (not a
            // snapshot reload) so each calibration cycle leaves no residual heap. The harness also
            // uses adapter.clearPipelineAsync() directly to reach the empty-pipeline heap baseline.
            const clearAsync = async () => {
                await adapter.clearPipelineAsync();
            };
            // Restores the snapshot the harness clears to capture the fixed empty-pipeline baseline.
            const reloadSnapshotAsync = async () => {
                await adapter.loadSnapshotAsync(snapshotRows);
            };

            // 4. Run the scenario through the endpoint-agnostic harness and persist the RunResult.
            //    onProgress drives the mask message (baseline / calibrate / iteration x of y).
            const result = await new MeasurementHarness().runScenarioAsync({
                scenario,
                adapter,
                nextBatchAsync,
                loadNRowsAsync,
                clearAsync,
                reloadSnapshotAsync,
                onProgress: p => this.updateProgress(p)
            });

            this.setLastResult(result);
            this.recordRun(result);
        } catch (e) {
            XH.handleException(e);
        } finally {
            if (ws) await ws.stopAsync();
        }
    }

    /** Map a harness progress update to a human-readable mask message. */
    private updateProgress(p: MeasurementProgress) {
        const {stage, current, total} = p;
        this.taskObserver.setMessage(
            current != null && total != null ? `${stage} ${current} of ${total}...` : `${stage}...`
        );
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

    // Append the completed run. The @persist provider on `savedRuns` writes the new array through
    // to localStorage automatically - no explicit save call.
    @action
    private recordRun(result: RunResult) {
        const label = `${result.scenario.name} @ ${fmtDateTimeSec(result.env.capturedAt)}`,
            run: SavedRun = {label, savedAt: result.env.capturedAt, result};
        this.savedRuns = [...this.savedRuns, run];
    }

    /** Discard all run history (with confirmation). Emptying the array clears the localStorage entry. */
    async clearSavedRunsAsync() {
        if (!this.savedRuns.length) return;
        const confirmed = await XH.confirm({
            title: 'Clear Run History',
            message: `Discard all ${this.savedRuns.length} saved run(s)? This cannot be undone.`,
            confirmProps: {text: 'Clear', intent: 'danger'}
        });
        if (confirmed) this.clearSavedRuns();
    }

    @action
    private clearSavedRuns() {
        this.savedRuns = [];
        this.compareLabels = [];
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

        // The two passes are optional, so timings and heap may be null on either run. Compare only
        // the metrics BOTH runs measured - a row is included only when its underlying stat is
        // non-null on each side (e.g. a memory-only run vs a both run yields heap + row-count rows).
        const a = runs[0].result.scorecard,
            b = runs[1].result.scorecard,
            metrics: Array<[string, number, number]> = [];

        // Timings (performance pass). Pipeline (cube + view) is the PRIMARY compute - surfaced first,
        // ahead of the genTransaction grid-relay Compute rows.
        if (a.pipeline && b.pipeline) {
            metrics.push(['Pipeline median (ms)', a.pipeline.medianMs, b.pipeline.medianMs]);
            metrics.push(['Pipeline p95 (ms)', a.pipeline.p95Ms, b.pipeline.p95Ms]);
        }
        if (a.compute && b.compute) {
            metrics.push(['Compute median (ms)', a.compute.medianMs, b.compute.medianMs]);
            metrics.push(['Compute p95 (ms)', a.compute.p95Ms, b.compute.p95Ms]);
        }
        if (a.bridgeCall && b.bridgeCall) {
            metrics.push(['Bridge median (ms)', a.bridgeCall.medianMs, b.bridgeCall.medianMs]);
            metrics.push(['Bridge p95 (ms)', a.bridgeCall.p95Ms, b.bridgeCall.p95Ms]);
        }
        if (a.render && b.render) {
            metrics.push(['Render median (ms)', a.render.medianMs, b.render.medianMs]);
        }

        // Heap by layer (memory pass).
        if (a.heap && b.heap) {
            metrics.push(['Heap total (bytes)', a.heap.totalHeapDelta, b.heap.totalHeapDelta]);
            metrics.push([
                'Cube records (bytes)',
                a.heap.cubeStoreRecords,
                b.heap.cubeStoreRecords
            ]);
            metrics.push([
                'Grid records (bytes)',
                a.heap.gridStoreRecords,
                b.heap.gridStoreRecords
            ]);
            metrics.push(['View rows (bytes)', a.heap.viewResultRows, b.heap.viewResultRows]);
            metrics.push([
                'AG Grid remainder (bytes)',
                a.heap.agGridInternals,
                b.heap.agGridInternals
            ]);
        }

        // Row counts - always present (the scenario is loaded in every run path).
        metrics.push(['Leaf rows', a.rowCounts.leaf, b.rowCounts.leaf]);
        metrics.push(['Grid rows', a.rowCounts.gridRows, b.rowCounts.gridRows]);

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
        if (v == null) return '-';
        // `filesize` expects a non-negative magnitude; heap deltas can be negative under the
        // degraded (no forced-GC) measurement path, so format the magnitude and re-apply the sign.
        const s = filesize(Math.abs(v), {round: 1});
        return v < 0 ? `-${s}` : s;
    }
}
