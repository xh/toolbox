import {GridModel} from '@xh/hoist/cmp/grid';
import {
    HoistModel,
    managed,
    persist,
    PersistOptions,
    PlainObject,
    TaskObserver
} from '@xh/hoist/core';
import {FieldType} from '@xh/hoist/data';
import {fmtDateTime, numberRenderer} from '@xh/hoist/format';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {isEmpty, isFunction, max, min, times} from 'lodash';
import type {GridTestModel} from './GridTestModel';

export type BenchmarkScenario = 'cold' | 'reload' | 'reloadSameRaw';

/** How the harness settled the heap around each measurement. */
export type GcMode = 'gc' | 'pressure';

/** A single load measured within a run. */
interface BenchmarkSample {
    /** Bytes added to `usedJSHeapSize` by the measured load, null if the API is unavailable. */
    heapDelta: number;
    loadMs: number;
    records: number;
    /** True if this iteration started from a baseline still holding the prior iteration's data. */
    suspect: boolean;
    /** Bytes by which this iteration's cleared-grid heap exceeded the pristine baseline. */
    residue: number;
}

/** Waits (ms) used while settling - generous, as an unsettled baseline invalidates the run. */
const GC_WAIT = 100,
    // gc() passes run until two consecutive reads agree, between these bounds - a large live set
    // is not reclaimed in one pass, and some of it is released only on later event-loop turns.
    GC_MIN_PASSES = 3,
    GC_MAX_PASSES = 25,
    GC_STABLE_DELTA = 1000000,
    PRESSURE_PASSES = 6,
    PRESSURE_WAIT = 100,
    // Reads taken after the pressure passes - the lowest wins, see settleHeapAsync().
    PRESSURE_READS = 6,
    PRESSURE_READ_WAIT = 400,
    // Arrays of 1M smis (~8MB each) - allocated then dropped to provoke a major GC.
    PRESSURE_ARRAYS = 8,
    PRESSURE_ARRAY_LENGTH = 1000000,
    // Grace given to React and ag-Grid to unmount and release after a grid teardown - that work
    // runs on later frames, not inline, so settling immediately would read a still-live set.
    GRID_RELEASE_WAIT = 500,
    // Bounds on waiting for a cleared grid's heap to return to the pristine baseline.
    PRISTINE_TIMEOUT = 15 * SECONDS,
    PRISTINE_POLL_WAIT = 250,
    // Residue tolerated at an iteration's baseline: the greater of this floor and this fraction of
    // the heap the *previous* iteration had to release. Scaled to the live set rather than fixed,
    // so a small dataset is not waved through by a tolerance sized for a large one.
    PRISTINE_TOLERANCE_FLOOR = 5000000,
    PRISTINE_TOLERANCE_PCT = 0.05,
    MAX_RESULTS = 100;

export const SCENARIO_LABELS: Record<BenchmarkScenario, string> = {
    cold: 'Cold load',
    reload: 'Reload (re-fetch)',
    reloadSameRaw: 'Reload (same raw refs)'
};

/**
 * Repeatable heap + timing harness for the Grid test panel, measuring the Store flags as currently
 * configured on the owning {@link GridTestModel}.
 *
 * Each iteration settles the heap, records a baseline, runs one load, settles again and records
 * the delta - repeated N times so results can be reported as a spread. Single measurements in this
 * domain are not trustworthy and are deliberately never presented on their own.
 *
 * Results accumulate (and persist to local storage) so several configs can be compared side by
 * side. Persistence matters here because toggling `projectionOnly` or `freezeData` reloads the
 * app - without it, each side of that A/B would land in a different session's results.
 *
 * Each row captures the full config that produced it, and reports only what was measured - no
 * derived comparisons against other rows. Reading across configs is the operator's job.
 */
export class GridTestBenchmarkModel extends HoistModel {
    override persistWith: PersistOptions = {localStorageKey: 'xhGridTestBenchmark'};

    readonly parent: GridTestModel;

    @bindable isOpen = false;

    @persist
    @bindable
    scenario: BenchmarkScenario = 'cold';

    @persist
    @bindable
    iterations = 3;

    /** Accumulated results, newest first. */
    @persist
    @observable.ref
    results: PlainObject[] = [];

    /** Progress detail while a run is in flight. */
    @observable status: string = null;

    /** Set when the last run could not guarantee independent iterations - see runBenchmarkAsync. */
    @observable warning: string = null;

    @managed runTask = TaskObserver.trackLast();

    @managed resultsGridModel: GridModel;

    // Scratch reference for the allocation-pressure fallback in settleHeapAsync().
    private junk: any = null;

    /** True if this browser exposes a real GC hook - i.e. Chrome run with --expose-gc. */
    get hasRealGc(): boolean {
        return isFunction(window['gc']);
    }

    get gcMode(): GcMode {
        return this.hasRealGc ? 'gc' : 'pressure';
    }

    /** True if this browser reports `performance.memory` - Chromium only. */
    get hasHeapApi(): boolean {
        return !!(performance as any).memory;
    }

    get isRunning(): boolean {
        return this.runTask.isPending;
    }

    get scenarioOptions() {
        return Object.entries(SCENARIO_LABELS).map(([value, label]) => ({value, label}));
    }

    constructor(parent: GridTestModel) {
        super();
        makeObservable(this);
        this.parent = parent;
        this.resultsGridModel = this.createResultsGridModel();
        this.addReaction({
            track: () => this.results,
            run: results => this.resultsGridModel.loadData(results),
            fireImmediately: true
        });
    }

    @action
    open() {
        this.isOpen = true;
    }

    @action
    close() {
        this.isOpen = false;
    }

    runBenchmark() {
        // Hard guard, not just a disabled button. Two overlapping runs silently corrupt *both*:
        // each clears and rebuilds the grid under the other, so one measures a baseline the other
        // has already dirtied and one records zero records against a multi-hundred-MB delta. Both
        // land as ordinary-looking rows - the suspect check cannot see this, as it only compares a
        // run against its own pristine baseline. Cheaper to refuse than to detect after the fact.
        if (this.isRunning) {
            this.logWarn('Benchmark already running - ignoring request to start another');
            return;
        }
        this.runBenchmarkAsync().linkTo(this.runTask).catchDefault();
    }

    @action
    clearResults() {
        this.results = [];
    }

    //------------------------
    // Implementation
    //------------------------
    /**
     * Run the configured scenario N times.
     *
     * Iteration independence is *verified*, not assumed:
     *
     *  - Each iteration starts by destroying and rebuilding the grid, not by clearing it - see
     *    resetGridAsync() for the measurements behind that.
     *  - A pristine baseline is captured once up front, and each later iteration waits for the
     *    heap to return to within tolerance of it before measuring.
     *  - An iteration whose heap does not come back still runs, but is flagged suspect and
     *    reported as such - never quietly averaged into a clean-looking median.
     */
    private async runBenchmarkAsync() {
        const {parent, scenario, iterations} = this,
            samples: BenchmarkSample[] = [];

        this.setWarning(null);

        this.setStatus('Settling pristine baseline');
        await this.resetGridAsync();
        const pristine = await this.settleHeapAsync();

        // Heap held at the end of the previous iteration, sizing the tolerance below.
        let priorPeak = null;

        for (let i = 0; i < iterations; i++) {
            const label = `Run ${i + 1} of ${iterations}`;

            let clearedHeap = pristine,
                residue = 0,
                suspect = false;

            if (i > 0) {
                this.setStatus(`${label}: rebuilding grid`);
                await this.resetGridAsync();

                const tolerance = this.toleranceFor(pristine, priorPeak),
                    returned = await this.awaitPristineHeapAsync(pristine, tolerance, label);
                clearedHeap = returned.heap;
                residue = returned.residue;
                suspect = returned.suspect;
            }

            let prepared: {rows: PlainObject[]; summary: PlainObject} = null;
            if (scenario === 'reload') {
                this.setStatus(`${label}: priming with a first load`);
                await parent.loadTestDataAsync();
            } else if (scenario === 'reloadSameRaw') {
                this.setStatus(`${label}: priming with a first load`);
                prepared = await parent.fetchRawRowsAsync();
                parent.loadRawRows(prepared.rows, prepared.summary);
            }

            // The cold scenario measures from the cleared-grid reading we already have. The reload
            // scenarios measure from the state after their priming load, so re-settle for those.
            let baseline = clearedHeap;
            if (scenario !== 'cold') {
                this.setStatus(`${label}: settling baseline`);
                baseline = await this.settleHeapAsync();
            }

            this.setStatus(`${label}: loading`);
            const loadMs = prepared
                ? parent.loadRawRows(prepared.rows, prepared.summary)
                : await parent.loadTestDataAsync();

            this.setStatus(`${label}: settling`);
            const post = await this.settleHeapAsync();
            priorPeak = post;

            samples.push({
                heapDelta: baseline != null && post != null ? post - baseline : null,
                loadMs,
                records: parent.gridModel.store.allCount,
                suspect,
                residue
            });

            // Drop the harness' own reference to the raw rows ahead of the next iteration.
            prepared = null;
        }

        this.addResult(samples);
        this.setStatus(null);
    }

    /**
     * Residue tolerated at an iteration's baseline - see PRISTINE_TOLERANCE_PCT. Sized against the
     * heap the previous iteration has to give back, so the bar scales with the dataset under test.
     */
    private toleranceFor(pristine: number, priorPeak: number): number {
        const toRelease = pristine != null && priorPeak != null ? priorPeak - pristine : 0;
        return Math.max(PRISTINE_TOLERANCE_FLOOR, toRelease * PRISTINE_TOLERANCE_PCT);
    }

    /**
     * Poll until the heap of the (already cleared) grid returns to within `tolerance` of the
     * pristine baseline, or the timeout expires. Each poll re-settles, so this keeps giving V8 and
     * ag-Grid further chances to release rather than merely re-reading.
     *
     * Returns the heap actually reached, its residue over pristine, and whether the iteration
     * should be treated as suspect. Suspect means exactly one thing: the measurement that follows
     * starts from a baseline known to be contaminated, and its delta is understated by up to
     * `residue`.
     */
    private async awaitPristineHeapAsync(
        pristine: number,
        tolerance: number,
        label: string
    ): Promise<{heap: number; residue: number; suspect: boolean}> {
        // Nothing to verify without the heap API - deltas are null anyway on that browser.
        if (pristine == null) return {heap: null, residue: 0, suspect: false};

        const deadline = Date.now() + PRISTINE_TIMEOUT;
        let heap = await this.settleHeapAsync(),
            residue = heap - pristine;

        while (residue > tolerance && Date.now() < deadline) {
            this.setStatus(
                `${label}: waiting for ${fmtMb(residue)}MB to release (tolerance ${fmtMb(tolerance)}MB)`
            );
            await wait(PRISTINE_POLL_WAIT);
            heap = await this.settleHeapAsync();
            residue = heap - pristine;
        }

        // A heap *below* pristine is fine - it just means the empty-grid state settled lower this
        // time. Only an excess above tolerance is contamination.
        return {heap, residue: Math.max(0, residue), suspect: residue > tolerance};
    }

    /**
     * Return to an empty-grid state between iterations - clear the Store, then destroy and rebuild
     * the GridModel, so the next iteration loads into a Store with no history (which also matters
     * for `reuseRecords`, whose record cache would otherwise carry over).
     *
     * **This does not reliably reclaim the memory, and no sequence tried here does.** Measured on
     * a freshly loaded page at 50k records x 157 populated fields, settling with repeated full
     * `window.gc()` passes at each step:
     *
     *   empty 377MB -> loaded 752MB (+375) -> after clear() 733MB -> after destroy 733MB
     *
     * So clearing gives back ~19MB of 375MB, destroying the grid on top of that gives back
     * nothing, and the dataset stays live behind a Store with no records and a destroyed grid.
     * Waiting longer does not help; the memory does come back, unpredictably, during a later load.
     * Something outside the Store and the GridModel is holding either the records or the raw rows,
     * and finding it is app/framework work beyond this harness.
     *
     * The consequence for measurement is unavoidable and is *reported* rather than papered over:
     * at this dataset size only the first iteration of a run starts from a verified-clean
     * baseline. awaitPristineHeapAsync() checks each later iteration against the pristine reading
     * and flags any that starts contaminated - see the warning raised in addResult().
     *
     * Interning caches are dropped here too - a retained cache would hand later iterations strings
     * the baseline has already paid for. Within an iteration the cache is left alone, which is
     * what makes the cross-fetch benefit of `internStrings` visible in the reload scenarios.
     *
     * The rebuild happens before the baseline is taken, so the cost of the new (empty) grid lands
     * in the baseline and not in the measured delta.
     */
    private async resetGridAsync() {
        const {parent} = this;
        parent.gridModel.clear();
        await wait(GRID_RELEASE_WAIT);

        parent.tearDown();
        parent.clearInternCache();
        await wait(GRID_RELEASE_WAIT);
    }

    /**
     * Push the heap toward a settled state, then read `usedJSHeapSize`.
     *
     * With `window.gc` (Chrome launched with `--js-flags="--expose-gc"`) this runs real, immediate
     * major collections, repeated until two consecutive reads agree (or a cap is hit) rather than
     * for a fixed count. A large live set is not reclaimed in one pass: objects only reachable
     * from the set just collected need a further pass, and anything released on a later
     * event-loop turn is not even unreachable yet when the first pass runs.
     *
     * Without it we fall back to allocation pressure: large short-lived arrays to provoke a major
     * GC, then the lowest of several spaced reads. The pressure arrays themselves inflate
     * `usedJSHeapSize` until they are collected, so a read taken too early reads high - never low
     * - which makes the minimum the best available estimate of the settled heap.
     *
     * The fallback remains best-effort only. `usedJSHeapSize` is quantized and an unsettled
     * baseline can still produce a *negative* delta, so every run is reported as a spread and
     * tagged with the mode that produced it.
     */
    private async settleHeapAsync(): Promise<number> {
        if (this.hasRealGc) {
            let prev = null,
                curr = null;
            for (let i = 0; i < GC_MAX_PASSES; i++) {
                window['gc']();
                await wait(GC_WAIT);
                curr = this.readHeap();
                if (curr == null) return null;
                const stable = prev != null && Math.abs(prev - curr) <= GC_STABLE_DELTA;
                if (stable && i >= GC_MIN_PASSES - 1) return curr;
                prev = curr;
            }
            return curr;
        }

        for (let i = 0; i < PRESSURE_PASSES; i++) {
            this.junk = times(PRESSURE_ARRAYS, () => new Array(PRESSURE_ARRAY_LENGTH).fill(i));
            this.junk = null;
            await wait(PRESSURE_WAIT);
        }

        let ret = null;
        for (let i = 0; i < PRESSURE_READS; i++) {
            await wait(PRESSURE_READ_WAIT);
            const heap = this.readHeap();
            if (heap == null) return null;
            ret = ret == null ? heap : Math.min(ret, heap);
        }
        return ret;
    }

    private readHeap(): number {
        return (performance as any).memory?.usedJSHeapSize ?? null;
    }

    @action
    private addResult(samples: BenchmarkSample[]) {
        const {parent} = this,
            heaps = samples.map(it => it.heapDelta).filter(it => it != null),
            loads = samples.map(it => it.loadMs),
            records = max(samples.map(it => it.records)),
            heapMed = median(heaps),
            suspects = samples.filter(it => it.suspect),
            now = Date.now();

        if (!isEmpty(suspects)) {
            this.setWarning(
                `${suspects.length} of ${samples.length} iterations started from a baseline still ` +
                    `holding up to ${fmtMb(max(suspects.map(it => it.residue)))}MB of the previous ` +
                    `iteration - their heap deltas are understated by that much, and the median ` +
                    `and min for this run are not meaningful. Only "Heap Δ #1" is measured from a ` +
                    `verified-clean baseline. The app does not give this dataset back when the ` +
                    `grid is cleared or destroyed, so for a defensible number run with Iterations ` +
                    `= 1 and repeat after a page reload - results persist across reloads.`
            );
        }

        this.results = [
            {
                id: `${now}-${this.results.length}`,
                timestamp: now,
                // Named config active when the run was recorded - the most descriptive label for
                // a row. Dirty marks unsaved deviations from that config at run time, so the name
                // alone never overstates what it describes.
                configName: parent.viewManagerModel.view.name,
                configDirty: parent.viewManagerModel.isValueDirty,
                scenario: this.scenario,
                gcMode: this.gcMode,
                iterations: samples.length,
                records,
                declaredFields: parent.declaredFieldCount,
                populatedFields: parent.populatedFieldCount,
                projectionOnly: parent.projectionOnly,
                denseRecordThreshold: parent.denseRecordThreshold,
                freezeData: parent.freezeData,
                retainRaw: parent.retainRaw,
                reuseRecords: parent.reuseRecords,
                internStrings: parent.internStrings,
                stream: parent.useStreaming,
                tree: parent.tree,
                summary: parent.showSummary,
                populateExtraFields: parent.populateExtraFields,
                // Recorded only where they actually shaped the data, so a row can never suggest a
                // distribution that was not in play. A null against populateExtraFields: true
                // therefore means the row pre-dates these settings - see the results grid.
                valueMix: parent.populateExtraFields ? parent.valueMix : null,
                categoryCount:
                    parent.populateExtraFields && parent.categoryCountApplies
                        ? parent.categoryCount
                        : null,
                xss: parent.enableXssProtection,
                // The first iteration always starts from the pristine baseline, so it stands even
                // when later ones are flagged - see resetGridAsync().
                heapFirst: samples[0]?.heapDelta ?? null,
                heapMin: isEmpty(heaps) ? null : min(heaps),
                heapMed,
                heapMax: isEmpty(heaps) ? null : max(heaps),
                bytesPerRecord: heapMed != null && records ? Math.round(heapMed / records) : null,
                loadMin: min(loads),
                loadMed: median(loads),
                loadMax: max(loads),
                suspectCount: suspects.length,
                residueMax: isEmpty(suspects) ? 0 : max(suspects.map(it => it.residue))
            },
            ...this.results
        ].slice(0, MAX_RESULTS);
    }

    @action
    private setStatus(status: string) {
        this.status = status;
    }

    @action
    private setWarning(warning: string) {
        this.warning = warning;
    }

    private createResultsGridModel(): GridModel {
        const FT = FieldType,
            boolCol = {
                width: 90,
                align: 'center' as const,
                renderer: v => (v ? '✓' : '·')
            },
            mbCol = {
                width: 110,
                align: 'right' as const,
                renderer: v => (v == null ? '—' : (v / 1000000).toFixed(1))
            },
            msCol = {width: 100, renderer: numberRenderer({precision: 0, label: 'ms'})};

        return new GridModel({
            store: {
                idSpec: 'id',
                fields: [
                    {name: 'timestamp', type: FT.NUMBER},
                    {name: 'configName', type: FT.STRING},
                    {name: 'configDirty', type: FT.BOOL},
                    {name: 'scenario', type: FT.STRING},
                    {name: 'gcMode', type: FT.STRING},
                    {name: 'iterations', type: FT.INT},
                    {name: 'records', type: FT.INT},
                    {name: 'declaredFields', type: FT.INT},
                    {name: 'populatedFields', type: FT.INT},
                    {name: 'projectionOnly', type: FT.BOOL},
                    {name: 'denseRecordThreshold', type: FT.INT},
                    {name: 'freezeData', type: FT.BOOL},
                    {name: 'retainRaw', type: FT.BOOL},
                    {name: 'reuseRecords', type: FT.BOOL},
                    {name: 'internStrings', type: FT.BOOL},
                    {name: 'stream', type: FT.BOOL},
                    {name: 'tree', type: FT.BOOL},
                    {name: 'summary', type: FT.BOOL},
                    {name: 'populateExtraFields', type: FT.BOOL},
                    {name: 'valueMix', type: FT.STRING},
                    {name: 'categoryCount', type: FT.INT},
                    {name: 'xss', type: FT.BOOL},
                    {name: 'heapFirst', type: FT.NUMBER},
                    {name: 'heapMin', type: FT.NUMBER},
                    {name: 'heapMed', type: FT.NUMBER},
                    {name: 'heapMax', type: FT.NUMBER},
                    {name: 'bytesPerRecord', type: FT.NUMBER},
                    {name: 'loadMin', type: FT.NUMBER},
                    {name: 'loadMed', type: FT.NUMBER},
                    {name: 'loadMax', type: FT.NUMBER},
                    {name: 'suspectCount', type: FT.INT},
                    {name: 'residueMax', type: FT.NUMBER}
                ]
            },
            sortBy: 'timestamp|desc',
            sizingMode: 'compact',
            emptyText: 'No benchmark runs recorded.',
            enableExport: true,
            columns: [
                {
                    groupId: 'run',
                    headerName: 'Run',
                    children: [
                        {
                            field: 'timestamp',
                            headerName: 'At',
                            width: 90,
                            renderer: v => fmtDateTime(v, {fmt: 'HH:mm:ss', asHtml: true})
                        },
                        {
                            field: 'configName',
                            headerName: 'Config',
                            width: 170,
                            tooltip: (v, {record}) => {
                                if (v == null)
                                    return 'Recorded before the active config was captured.';
                                return record.data.configDirty
                                    ? `Run with unsaved changes on top of "${v}" - the * marks deviation from the saved config.`
                                    : `Run with saved config "${v}" as loaded.`;
                            },
                            renderer: (v, {record}) =>
                                v == null ? '·' : record.data.configDirty ? `${v} *` : v
                        },
                        {
                            field: 'scenario',
                            width: 150,
                            renderer: v => SCENARIO_LABELS[v] ?? v
                        },
                        {
                            field: 'gcMode',
                            headerName: 'GC',
                            width: 90,
                            tooltip: v =>
                                v === 'gc'
                                    ? 'Settled with real GC via window.gc'
                                    : 'Settled with allocation pressure only - treat heap numbers with caution',
                            renderer: v => (v === 'gc' ? 'window.gc' : 'pressure')
                        },
                        {field: 'iterations', headerName: 'N', width: 50},
                        {
                            field: 'suspectCount',
                            headerName: 'Suspect',
                            width: 90,
                            align: 'center',
                            tooltip: (v, {record}) => {
                                if (v == null)
                                    return 'Recorded before baselines were verified - unknown.';
                                return v
                                    ? `${v} iteration(s) started from a baseline still holding up to ${fmtMb(record.data.residueMax)}MB of the previous iteration - their heap deltas are understated by that much.`
                                    : 'All iterations started from a verified-pristine baseline.';
                            },
                            renderer: (v, {record}) => {
                                if (v == null) return '?';
                                return v ? `⚠ ${v} (${fmtMb(record.data.residueMax)}MB)` : 'ok';
                            }
                        }
                    ]
                },
                {
                    groupId: 'heap',
                    headerName: 'Heap (MB)',
                    children: [
                        {
                            field: 'heapFirst',
                            headerName: 'Δ #1',
                            ...mbCol,
                            width: 100,
                            tooltip: () =>
                                'First iteration only - the one always measured from the pristine baseline. Trust this when the Suspect column is not "ok".'
                        },
                        {field: 'heapMed', headerName: 'Δ Med', ...mbCol, width: 100},
                        {field: 'heapMin', headerName: 'Min', ...mbCol, width: 90},
                        {field: 'heapMax', headerName: 'Max', ...mbCol, width: 90},
                        {
                            field: 'bytesPerRecord',
                            headerName: 'Bytes/Rec',
                            width: 100,
                            renderer: numberRenderer({precision: 0})
                        }
                    ]
                },
                {
                    groupId: 'load',
                    headerName: 'Load (ms)',
                    children: [
                        {field: 'loadMed', headerName: 'Med', ...msCol, width: 90},
                        {field: 'loadMin', headerName: 'Min', ...msCol, width: 90},
                        {field: 'loadMax', headerName: 'Max', ...msCol, width: 90}
                    ]
                },
                {
                    groupId: 'dataset',
                    headerName: 'Dataset',
                    children: [
                        {
                            field: 'records',
                            width: 100,
                            renderer: numberRenderer({precision: 0})
                        },
                        {field: 'declaredFields', headerName: 'Fields Decl', width: 100},
                        {field: 'populatedFields', headerName: 'Fields Pop', width: 100},
                        {field: 'populateExtraFields', headerName: 'PopFields', ...boolCol},
                        {
                            field: 'valueMix',
                            headerName: 'Mix',
                            width: 110,
                            tooltip: (v, {record}) => valueCharTooltip(v, record.data),
                            renderer: (v, {record}) =>
                                v ?? (record.data.populateExtraFields ? '?' : '·')
                        },
                        {
                            field: 'categoryCount',
                            headerName: 'Cats',
                            width: 90,
                            align: 'right',
                            tooltip: (v, {record}) => valueCharTooltip(v, record.data),
                            renderer: (v, {record}) =>
                                v != null
                                    ? fmtInt(v)
                                    : record.data.populateExtraFields &&
                                        record.data.valueMix == null
                                      ? '?'
                                      : '·'
                        },
                        {field: 'tree', headerName: 'Tree', ...boolCol},
                        {field: 'summary', headerName: 'Summary', ...boolCol}
                    ]
                },
                {
                    groupId: 'flags',
                    headerName: 'Store + Fetch Flags',
                    children: [
                        {field: 'projectionOnly', headerName: 'Projection', ...boolCol},
                        {
                            field: 'denseRecordThreshold',
                            headerName: 'DenseThresh',
                            align: 'right',
                            width: 100
                        },
                        {field: 'freezeData', headerName: 'Freeze', ...boolCol},
                        {field: 'retainRaw', headerName: 'RetainRaw', ...boolCol},
                        {field: 'reuseRecords', headerName: 'Reuse', ...boolCol},
                        {field: 'internStrings', headerName: 'Intern', ...boolCol},
                        {field: 'stream', headerName: 'Stream', ...boolCol},
                        {field: 'xss', headerName: 'XSS', ...boolCol}
                    ]
                }
            ]
        });
    }
}

//------------------------
// Local helpers
//------------------------
function median(vals: number[]): number {
    if (isEmpty(vals)) return null;
    const sorted = [...vals].sort((a, b) => a - b),
        mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function fmtInt(v: number): string {
    return v == null ? '' : Math.round(v).toLocaleString();
}

function fmtMb(v: number): string {
    return v == null ? '' : (v / 1000000).toFixed(1);
}

/**
 * Tooltip for the value-character columns, which is mostly about telling three states apart:
 * recorded and applicable, applicable but recorded before the setting existed, or not applicable.
 * The middle case matters - those rows were measured against the old fixed value cycle, whose
 * categorical and unique strings were variable-width, so their byte figures do not compare with
 * anything measured since.
 */
function valueCharTooltip(v: any, row: PlainObject): string {
    if (v != null) return null;
    if (!row.populateExtraFields) {
        return 'Not applicable - extra fields were declared but left unpopulated.';
    }
    if (row.valueMix == null) {
        return 'Recorded before the value mix was configurable, against the old fixed cycle of variable-width values. Byte figures from this row do not compare with later runs - re-measure before using it.';
    }
    return 'Not applicable - this value mix generates no categorical values.';
}
