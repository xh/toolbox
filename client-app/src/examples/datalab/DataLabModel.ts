import {FormModel} from '@xh/hoist/cmp/form';
import {ColumnRenderer, GridModel} from '@xh/hoist/cmp/grid';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {HoistModel, managed, persist, PlainObject, TaskObserver, XH} from '@xh/hoist/core';
import {
    BaselineAdapter,
    Constraint,
    DEFAULT_PROTOCOL,
    EnvMetadata,
    MeasurementHarness,
    MeasurementProgress,
    numberIs,
    required,
    RunResult,
    ScenarioConfig,
    UpdateCadence
} from '@xh/hoist/data';
import {fmtDateTimeSec, fmtNumber, numberRenderer} from '@xh/hoist/format';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {downloadBlob} from '@xh/hoist/utils/js';
import {filesize} from 'filesize';
import {minBy, round, sortBy, uniqBy} from 'lodash';
import {HttpIngestAdapter} from './ingest/HttpIngestAdapter';
import {WebSocketIngestAdapter} from './ingest/WebSocketIngestAdapter';

/** A persisted run: the RunResult plus a user-facing label/timestamp for the run-history view. */
export interface SavedRun {
    label: string;
    savedAt: string;
    result: RunResult;
}

//------------------------------------------------------------------------------------------------
// Distilled envelope-stats schema (D-12) - the SINGLE SOURCE of the distilled shape
//
// `exportDistilledStats` emits this flat, chart-ready object; phase 03-04 saves that output verbatim
// to docs/planning/data2/stats/envelope-stats.json. The schema is shaped so a design tool consumes
// it WITHOUT parsing verbose RunResult objects. Keep these interfaces and the 03-04 schema in lockstep.
//------------------------------------------------------------------------------------------------

/**
 * Descriptive coarse memory-pressure tier (D-02). These describe OBSERVED heap behavior across the
 * ladder - they are NOT adopted pass/fail targets (targets are proposed later, in 03-06).
 */
export type MemoryTier = 'comfortable' | 'degraded' | 'hardWall';

/** One memory rung: heap retained (total + by layer) at a given dataset shape, with its tier. */
export interface MemorySeriesRow {
    leafRowCount: number;
    fieldCount: number;
    totalHeapDeltaBytes: number;
    cubeStoreRecords: number;
    gridStoreRecords: number;
    viewResultRows: number;
    agGridInternals: number;
    tier: MemoryTier;
}

/** One CPU rung: the four stage medians + derived end-to-end and keep-up verdict at a given cadence. */
export interface CpuSeriesRow {
    batchSize: number;
    ratePerSec: number;
    cadence: UpdateCadence;
    engineMedianMs: number;
    engineP95Ms: number;
    genTxnMedianMs: number;
    bridgeMedianMs: number;
    renderMedianMs: number;
    /** Sum of the four stage medians - the full update-to-render cost (D-03). */
    endToEndMedianMs: number;
    /** Time budget between batches at this rate (1000 / ratePerSec). */
    batchIntervalMs: number;
    /** Whether the pipeline keeps up: end-to-end median fits within the batch interval (D-03). */
    keepsUp: boolean;
}

/** The ~500 x 20 real-time trading-screen anchor batch, broken into its four stages (BASE-03). */
export interface AnchorBatch {
    batchSize: number;
    fieldCount: number;
    engineMs: number;
    genTxnMs: number;
    bridgeMs: number;
    renderMs: number;
    endToEndMs: number;
}

/** An approximate tier boundary read off the coarse ladder, with where it was observed and why. */
export interface TierBoundary {
    axis: 'memory' | 'cpu';
    from: string;
    to: string;
    /** Dataset shape at which a memory boundary was observed. */
    atShape?: string;
    /** Update cadence at which a CPU boundary was observed. */
    atCadence?: string;
    observedValue: number;
    rationale: string;
}

/** The complete distilled, flat, chart-ready envelope-stats package (D-12). */
export interface DistilledStats {
    generatedAt: string;
    referenceMachine: string;
    env: EnvMetadata[];
    memorySeries: MemorySeriesRow[];
    cpuSeries: CpuSeriesRow[];
    anchorBatch: AnchorBatch | null;
    tierBoundaries: TierBoundary[];
}

// Descriptive coarse memory tiers (D-02): retained heap well under a normal desktop tab budget is
// comfortable; approaching a typical per-tab ceiling is degraded; near or beyond the OOM wall
// (especially on small-heap machines) is hardWall. Provisional boundaries describing observed data.
const MEM_TIER_COMFORTABLE_MAX_BYTES = 500e6, // < 500 MB retained
    MEM_TIER_DEGRADED_MAX_BYTES = 1.2e9; // 500 MB - 1.2 GB; beyond is hardWall

// The real-time trading-screen anchor workload (BASE-03): ~500 rows/tick touching ~20 fields.
const ANCHOR_BATCH_SIZE = 500,
    ANCHOR_FIELD_COUNT = 20;

/** Classify retained-heap magnitude into a descriptive coarse tier (D-02). */
function memoryTier(totalHeapDeltaBytes: number): MemoryTier {
    if (totalHeapDeltaBytes < MEM_TIER_COMFORTABLE_MAX_BYTES) return 'comfortable';
    if (totalHeapDeltaBytes < MEM_TIER_DEGRADED_MAX_BYTES) return 'degraded';
    return 'hardWall';
}

/** Make a label safe for a filename: lowercase with non-alphanumerics collapsed to single hyphens. */
function sanitizeFilename(label: string): string {
    const clean = (label ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return clean || 'run';
}

/** Compact filesystem-friendly UTC timestamp for export filenames (no colons or dots). */
function fileTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
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

/** Unit of a comparison metric - drives how its run/delta values render. */
type CompareUnit = 'ms' | 'bytes' | 'count';

/**
 * Renders a comparison run/delta value by its row's unit: bytes and counts as whole numbers (with
 * comma separators), timings with a couple of decimals. Both via the Hoist number formatter.
 */
const compareValueRenderer: ColumnRenderer<number> = (v, {record}) =>
    v == null ? '' : fmtNumber(v, {precision: record.data.unit === 'ms' ? 2 : 0});

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
        measure: {memory: true, performance: true},
        grid: {useVirtualColumns: true}
    };
}

/**
 * Drives the framework {@link MeasurementHarness} for the Data Lab Toolbox example.
 *
 * Responsibilities (the integration seam with the endpoint-agnostic harness core, 02-05):
 *  - Holds an editable {@link ScenarioConfig} (the 02-01 knobs), bound to Hoist inputs in the panel.
 *  - OWNS THE TRANSPORT: pre-fetches the snapshot over the chosen transport (HTTP or WebSocket,
 *    Task 1 adapters) and pre-loads it into a {@link BaselineAdapter} BEFORE running; supplies the
 *    injected per-iteration `nextDiffAsync` + per-record sizing callbacks. The harness fetches nothing.
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
                },
                {
                    name: 'useVirtualColumns',
                    displayName: 'Virtual columns',
                    initialValue: d.grid.useVirtualColumns
                }
            ]
        });

        this.comparisonGridModel = new GridModel({
            store: {idSpec: 'id'},
            emptyText: 'Select two saved runs to compare',
            columns: [
                {field: 'metric', width: 220},
                {
                    field: 'runA',
                    headerName: 'Run A',
                    width: 130,
                    align: 'right',
                    renderer: compareValueRenderer
                },
                {
                    field: 'runB',
                    headerName: 'Run B',
                    width: 130,
                    align: 'right',
                    renderer: compareValueRenderer
                },
                {
                    field: 'delta',
                    headerName: 'Delta',
                    width: 130,
                    align: 'right',
                    renderer: compareValueRenderer
                },
                {
                    field: 'pct',
                    headerName: '% Change',
                    width: 110,
                    align: 'right',
                    // Up / down arrow glyph by sign, with a trailing '%' label.
                    renderer: numberRenderer({
                        precision: 1,
                        label: '%',
                        withSignGlyph: true,
                        nullDisplay: '-'
                    })
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
            measure: {memory: v.measureMemory, performance: v.measurePerformance},
            grid: {useVirtualColumns: v.useVirtualColumns}
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

        // 1. Select the ingest adapter per the transport knob (Task 1). The UI owns ALL fetch. The
        //    WebSocket stream is only spun up when the performance pass will actually consume diffs -
        //    a memory-only run applies no updates, so transport is irrelevant and HTTP fetches the
        //    snapshot either way.
        const http = new HttpIngestAdapter(),
            ws =
                scenario.measure.performance && update.transport === 'webSocket'
                    ? new WebSocketIngestAdapter()
                    : null;

        // Fresh baseline adapter per run so each iteration starts from a clean pipeline/heap.
        const adapter = new BaselineAdapter({
            dimensions: dataset.dimensions,
            aggregators: dataset.aggregators?.length ? dataset.aggregators : null,
            useVirtualColumns: scenario.grid.useVirtualColumns
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

            // 3. Build the injected per-iteration data-provider + per-record sizing callbacks. For WS
            //    the harness pulls each buffered/incoming pushed diff; for HTTP it polls the next
            //    deterministic diff. Sizing rows are pulled from the same transport.
            const nextDiffAsync = ws
                ? () => ws.nextDiffAsync()
                : () => http.nextDiffAsync(scenario);

            const sizingHttp = new HttpIngestAdapter();
            const loadNRowsAsync = async (n: number) => {
                const rows = await sizingHttp.loadSnapshotAsync({
                    ...scenario,
                    dataset: {...dataset, leafRowCount: n}
                });
                await adapter.loadSnapshotAsync(rows);
            };
            // Sizing teardown: empty the sizing rows to a TRUE-EMPTY pipeline (not a snapshot
            // reload) so each sizing cycle leaves no residual heap. The harness also uses
            // adapter.clearPipelineAsync() directly to reach the empty-pipeline heap baseline.
            const clearAsync = async () => {
                await adapter.clearPipelineAsync();
            };
            // Restores the snapshot the harness clears to capture the fixed empty-pipeline baseline.
            const reloadSnapshotAsync = async () => {
                await adapter.loadSnapshotAsync(snapshotRows);
            };

            // 4. Run the scenario through the endpoint-agnostic harness and persist the RunResult.
            //    onProgress drives the mask message (measuring memory / performance x of y).
            const result = await new MeasurementHarness().runScenarioAsync({
                scenario,
                adapter,
                nextDiffAsync,
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
            metrics: Array<[string, number, number, CompareUnit]> = [];

        // Timings (performance pass). Engine (cube + view) is the PRIMARY data-layer cost - surfaced
        // first, ahead of the genTransaction grid-relay rows.
        if (a.engine && b.engine) {
            metrics.push(['Engine median (ms)', a.engine.medianMs, b.engine.medianMs, 'ms']);
            metrics.push(['Engine p95 (ms)', a.engine.p95Ms, b.engine.p95Ms, 'ms']);
        }
        if (a.genTxn && b.genTxn) {
            metrics.push(['Build txn median (ms)', a.genTxn.medianMs, b.genTxn.medianMs, 'ms']);
            metrics.push(['Build txn p95 (ms)', a.genTxn.p95Ms, b.genTxn.p95Ms, 'ms']);
        }
        if (a.bridgeCall && b.bridgeCall) {
            metrics.push([
                'Bridge median (ms)',
                a.bridgeCall.medianMs,
                b.bridgeCall.medianMs,
                'ms'
            ]);
            metrics.push(['Bridge p95 (ms)', a.bridgeCall.p95Ms, b.bridgeCall.p95Ms, 'ms']);
        }
        if (a.render && b.render) {
            metrics.push(['Render median (ms)', a.render.medianMs, b.render.medianMs, 'ms']);
        }

        // Heap by layer (memory pass).
        if (a.heap && b.heap) {
            metrics.push([
                'Heap total (bytes)',
                a.heap.totalHeapDelta,
                b.heap.totalHeapDelta,
                'bytes'
            ]);
            metrics.push([
                'Cube records (bytes)',
                a.heap.cubeStoreRecords,
                b.heap.cubeStoreRecords,
                'bytes'
            ]);
            metrics.push([
                'Grid records (bytes)',
                a.heap.gridStoreRecords,
                b.heap.gridStoreRecords,
                'bytes'
            ]);
            metrics.push([
                'View rows (bytes)',
                a.heap.viewResultRows,
                b.heap.viewResultRows,
                'bytes'
            ]);
            metrics.push([
                'AG Grid remainder (bytes)',
                a.heap.agGridInternals,
                b.heap.agGridInternals,
                'bytes'
            ]);
        }

        // Row counts - always present (the scenario is loaded in every run path).
        metrics.push(['Leaf rows', a.rowCounts.leaf, b.rowCounts.leaf, 'count']);
        metrics.push(['Grid rows', a.rowCounts.gridRows, b.rowCounts.gridRows, 'count']);

        return metrics.map(([metric, valA, valB, unit], idx) => {
            const delta = valB - valA,
                pct = valA !== 0 ? round((delta / valA) * 100, 1) : null;
            return {id: idx, metric, runA: valA, runB: valB, delta, pct, unit};
        });
    }

    //------------------------------------------------------------------------------------------------
    // Export - runs out as JSON files for the checked-in stats dir + cross-machine comparison (D-11)
    //------------------------------------------------------------------------------------------------

    /** Download a single saved run as a JSON file (its verbatim RunResult). */
    exportRun(run: SavedRun) {
        if (!run) return;
        this.downloadJson(run.result, `datalab-run-${sanitizeFilename(run.label)}.json`);
    }

    /** Export the saved run currently selected in a comparison slot (resolved by its label). */
    exportSelectedRun(label: string) {
        const run = this.savedRuns.find(r => r.label === label);
        if (run) this.exportRun(run);
    }

    /** Download all saved runs as a single JSON file (an array of RunResult, re-importable). */
    exportAllRuns() {
        if (!this.savedRuns.length) {
            XH.warningToast('No saved runs to export.');
            return;
        }
        const payload = this.savedRuns.map(r => r.result);
        this.downloadJson(payload, `datalab-runs-all-${fileTimestamp()}.json`);
    }

    /**
     * Download the distilled, flat, chart-ready envelope-stats package (D-12) built from the saved
     * runs. This is the SINGLE SOURCE of the distilled schema - 03-04 saves this output verbatim.
     * The design tool consumes it WITHOUT parsing verbose RunResult objects.
     */
    exportDistilledStats() {
        if (!this.savedRuns.length) {
            XH.warningToast('No saved runs to distill. Run a scenario first.');
            return;
        }
        this.downloadJson(this.buildDistilledStats(this.savedRuns), 'datalab-envelope-stats.json');
    }

    /** Build the distilled envelope-stats object (D-12) from a set of saved runs. */
    private buildDistilledStats(runs: SavedRun[]): DistilledStats {
        const results = runs.map(r => r.result),
            memorySeries = this.buildMemorySeries(results),
            cpuSeries = this.buildCpuSeries(results);

        // Distinct environments across the runs - EnvMetadata is carried through so each origin
        // machine / flag set is preserved (Pitfall 6), never flattened away.
        const env = uniqBy(
            results.map(r => r.env),
            e => `${e.userAgent}|${e.heapMethod}|${e.crossOriginIsolated}|${e.preciseMemory}`
        );

        // EnvMetadata carries no explicit machine-name field, so the userAgent is the best available
        // machine identifier. Use the most recent run's userAgent as the reference machine.
        const referenceMachine = results[results.length - 1].env.userAgent;

        return {
            generatedAt: new Date().toISOString(),
            referenceMachine,
            env,
            memorySeries,
            cpuSeries,
            anchorBatch: this.buildAnchorBatch(results),
            tierBoundaries: this.buildTierBoundaries(memorySeries, cpuSeries)
        };
    }

    // One row per memory rung (deduped by dataset shape, last run wins), ascending by shape.
    private buildMemorySeries(results: RunResult[]): MemorySeriesRow[] {
        const byRung = new Map<string, MemorySeriesRow>();
        for (const r of results) {
            const {heap} = r.scorecard;
            if (!heap) continue; // memory pass skipped for this run
            const {leafRowCount, fieldCount} = r.scenario.dataset;
            byRung.set(`${leafRowCount}x${fieldCount}`, {
                leafRowCount,
                fieldCount,
                totalHeapDeltaBytes: heap.totalHeapDelta,
                cubeStoreRecords: heap.cubeStoreRecords,
                gridStoreRecords: heap.gridStoreRecords,
                viewResultRows: heap.viewResultRows,
                agGridInternals: heap.agGridInternals,
                tier: memoryTier(heap.totalHeapDelta)
            });
        }
        return sortBy([...byRung.values()], ['leafRowCount', 'fieldCount']);
    }

    // One row per CPU rung (deduped by cadence, last run wins), ascending by batch size then rate.
    private buildCpuSeries(results: RunResult[]): CpuSeriesRow[] {
        const byRung = new Map<string, CpuSeriesRow>();
        for (const r of results) {
            const {engine, genTxn, bridgeCall, render} = r.scorecard;
            if (!engine) continue; // performance pass skipped for this run
            const {batchSize, ratePerSec, cadence} = r.scenario.update,
                genTxnMedianMs = genTxn?.medianMs ?? 0,
                bridgeMedianMs = bridgeCall?.medianMs ?? 0,
                renderMedianMs = render?.medianMs ?? 0,
                endToEndMedianMs =
                    engine.medianMs + genTxnMedianMs + bridgeMedianMs + renderMedianMs,
                batchIntervalMs = ratePerSec > 0 ? 1000 / ratePerSec : Infinity;
            byRung.set(`${batchSize}/${ratePerSec}/${cadence}`, {
                batchSize,
                ratePerSec,
                cadence,
                engineMedianMs: engine.medianMs,
                engineP95Ms: engine.p95Ms,
                genTxnMedianMs,
                bridgeMedianMs,
                renderMedianMs,
                endToEndMedianMs,
                batchIntervalMs,
                keepsUp: endToEndMedianMs <= batchIntervalMs
            });
        }
        return sortBy([...byRung.values()], ['batchSize', 'ratePerSec']);
    }

    // The stage breakdown of the run closest to the ~500 x 20 trading-screen anchor (BASE-03).
    private buildAnchorBatch(results: RunResult[]): AnchorBatch | null {
        const perfRuns = results.filter(r => r.scorecard.engine);
        if (!perfRuns.length) return null;
        const best = minBy(
            perfRuns,
            r =>
                Math.abs(r.scenario.update.batchSize - ANCHOR_BATCH_SIZE) +
                Math.abs(r.scenario.dataset.fieldCount - ANCHOR_FIELD_COUNT)
        );
        const {engine, genTxn, bridgeCall, render} = best.scorecard,
            engineMs = engine.medianMs,
            genTxnMs = genTxn?.medianMs ?? 0,
            bridgeMs = bridgeCall?.medianMs ?? 0,
            renderMs = render?.medianMs ?? 0;
        return {
            batchSize: best.scenario.update.batchSize,
            fieldCount: best.scenario.dataset.fieldCount,
            engineMs,
            genTxnMs,
            bridgeMs,
            renderMs,
            endToEndMs: engineMs + genTxnMs + bridgeMs + renderMs
        };
    }

    // Approximate green->yellow / yellow->red boundaries read off the ascending coarse ladders.
    private buildTierBoundaries(
        memorySeries: MemorySeriesRow[],
        cpuSeries: CpuSeriesRow[]
    ): TierBoundary[] {
        const boundaries: TierBoundary[] = [],
            firstDegraded = memorySeries.find(m => m.tier === 'degraded'),
            firstHardWall = memorySeries.find(m => m.tier === 'hardWall'),
            firstOverrun = cpuSeries.find(c => !c.keepsUp);

        if (firstDegraded) {
            boundaries.push({
                axis: 'memory',
                from: 'comfortable',
                to: 'degraded',
                atShape: `${firstDegraded.leafRowCount} leaves x ${firstDegraded.fieldCount} fields`,
                observedValue: firstDegraded.totalHeapDeltaBytes,
                rationale: `Retained heap crosses ~${round(MEM_TIER_COMFORTABLE_MAX_BYTES / 1e6)} MB - a normal desktop tab still copes, but headroom is shrinking.`
            });
        }
        if (firstHardWall) {
            boundaries.push({
                axis: 'memory',
                from: 'degraded',
                to: 'hardWall',
                atShape: `${firstHardWall.leafRowCount} leaves x ${firstHardWall.fieldCount} fields`,
                observedValue: firstHardWall.totalHeapDeltaBytes,
                rationale: `Retained heap crosses ~${round(MEM_TIER_DEGRADED_MAX_BYTES / 1e9, 1)} GB - near the per-tab OOM ceiling, especially on small-heap machines.`
            });
        }
        if (firstOverrun) {
            boundaries.push({
                axis: 'cpu',
                from: 'keepsUp',
                to: 'overruns',
                atCadence: `${firstOverrun.batchSize} rows/tick @ ${firstOverrun.ratePerSec}/s (${firstOverrun.cadence})`,
                observedValue: firstOverrun.endToEndMedianMs,
                rationale: `Median update-to-render (${round(firstOverrun.endToEndMedianMs, 1)} ms) exceeds the ${round(firstOverrun.batchIntervalMs, 1)} ms batch interval - the pipeline falls behind the stream.`
            });
        }
        return boundaries;
    }

    private downloadJson(payload: unknown, filename: string) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
        downloadBlob(blob, filename);
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
