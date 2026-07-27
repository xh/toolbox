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
}

/** Waits (ms) used while settling - generous, as an unsettled baseline invalidates the run. */
const GC_PASSES = 3,
    GC_WAIT = 100,
    PRESSURE_PASSES = 6,
    PRESSURE_WAIT = 100,
    // Reads taken after the pressure passes - the lowest wins, see settleHeapAsync().
    PRESSURE_READS = 6,
    PRESSURE_READ_WAIT = 400,
    // Arrays of 1M smis (~8MB each) - allocated then dropped to provoke a major GC.
    PRESSURE_ARRAYS = 8,
    PRESSURE_ARRAY_LENGTH = 1000000,
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
 * side. Persistence matters here because toggling `optimizeRecordData` or `freezeData` reloads the
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

    /** One-line summary of the config the next run will measure. */
    get configSummary(): string {
        const {parent} = this,
            flags = [
                ['optimizeRecordData', parent.optimizeRecordData],
                ['freezeData', parent.freezeData],
                ['retainRaw', parent.retainRaw],
                ['reuseRecords', parent.reuseRecords],
                ['internStrings', parent.internStrings]
            ] as Array<[string, boolean]>;

        return [
            `${parent.recordCount.toLocaleString()} records`,
            `${parent.declaredFieldCount} fields declared`,
            parent.populateExtraFields ? 'extra fields populated' : 'extra fields sparse',
            parent.useStreaming ? 'streaming load' : 'JSON load',
            ...flags.map(([name, on]) => `${name}: ${on ? 'on' : 'off'}`)
        ].join('  •  ');
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
        this.runBenchmarkAsync().linkTo(this.runTask).catchDefault();
    }

    @action
    clearResults() {
        this.results = [];
    }

    /** All results as a markdown table, for pasting into notes/tickets. */
    get resultsAsMarkdown(): string {
        const cols = [
                ['Run At', (r: PlainObject) => fmtDateTime(r.timestamp, {asHtml: true})],
                ['Scenario', r => SCENARIO_LABELS[r.scenario] ?? r.scenario],
                ['GC', r => (r.gcMode === 'gc' ? 'window.gc' : 'pressure')],
                ['N', r => r.iterations],
                ['Records', r => fmtInt(r.records)],
                ['Fields (decl)', r => r.declaredFields],
                ['Fields (pop)', r => r.populatedFields],
                ['optimizeRecordData', r => yn(r.optimizeRecordData)],
                ['freezeData', r => yn(r.freezeData)],
                ['retainRaw', r => yn(r.retainRaw)],
                ['reuseRecords', r => yn(r.reuseRecords)],
                ['internStrings', r => yn(r.internStrings)],
                ['stream', r => yn(r.stream)],
                ['tree', r => yn(r.tree)],
                ['summary', r => yn(r.summary)],
                ['populateExtraFields', r => yn(r.populateExtraFields)],
                ['xss', r => yn(r.xss)],
                ['Heap Δ med (MB)', r => fmtMb(r.heapMed)],
                ['min', r => fmtMb(r.heapMin)],
                ['max', r => fmtMb(r.heapMax)],
                ['Bytes/rec', r => fmtInt(r.bytesPerRecord)],
                ['Load med (ms)', r => fmtInt(r.loadMed)],
                ['min', r => fmtInt(r.loadMin)],
                ['max', r => fmtInt(r.loadMax)]
            ] as Array<[string, (r: PlainObject) => any]>,
            header = `| ${cols.map(it => it[0]).join(' | ')} |`,
            divider = `| ${cols.map(() => '---').join(' | ')} |`,
            rows = this.results.map(r => `| ${cols.map(it => it[1](r) ?? '').join(' | ')} |`);

        return [header, divider, ...rows].join('\n');
    }

    //------------------------
    // Implementation
    //------------------------
    private async runBenchmarkAsync() {
        const {parent, scenario, iterations} = this,
            samples: BenchmarkSample[] = [];

        for (let i = 0; i < iterations; i++) {
            const label = `Run ${i + 1} of ${iterations}`;

            // Start each iteration from an empty grid and a cold interning cache, so iterations
            // are independent - a retained cache would hand later runs strings the baseline has
            // already paid for. Within an iteration the cache is left alone, which is what makes
            // the cross-fetch benefit of `internStrings` visible in the reload scenarios.
            this.setStatus(`${label}: clearing`);
            parent.gridModel.clear();
            parent.clearInternCache();

            let prepared: {rows: PlainObject[]; summary: PlainObject} = null;
            if (scenario === 'reload') {
                this.setStatus(`${label}: priming with a first load`);
                await parent.loadTestDataAsync();
            } else if (scenario === 'reloadSameRaw') {
                this.setStatus(`${label}: priming with a first load`);
                prepared = await parent.fetchRawRowsAsync();
                parent.loadRawRows(prepared.rows, prepared.summary);
            }

            this.setStatus(`${label}: settling baseline`);
            const baseline = await this.settleHeapAsync();

            this.setStatus(`${label}: loading`);
            const loadMs = prepared
                ? parent.loadRawRows(prepared.rows, prepared.summary)
                : await parent.loadTestDataAsync();

            this.setStatus(`${label}: settling`);
            const post = await this.settleHeapAsync();

            samples.push({
                heapDelta: baseline != null && post != null ? post - baseline : null,
                loadMs,
                records: parent.gridModel.store.allCount
            });

            // Drop the harness' own reference to the raw rows ahead of the next iteration.
            prepared = null;
        }

        this.addResult(samples);
        this.setStatus(null);
    }

    /**
     * Push the heap toward a settled state, then read `usedJSHeapSize`.
     *
     * With `window.gc` (Chrome launched with `--js-flags="--expose-gc"`) this runs real, immediate
     * major collections - repeated, as a first pass can leave newly-unreachable objects behind.
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
            for (let i = 0; i < GC_PASSES; i++) {
                window['gc']();
                await wait(GC_WAIT);
            }
            return this.readHeap();
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
            now = Date.now();

        this.results = [
            {
                id: `${now}-${this.results.length}`,
                timestamp: now,
                scenario: this.scenario,
                gcMode: this.gcMode,
                iterations: samples.length,
                records,
                declaredFields: parent.declaredFieldCount,
                populatedFields: parent.populatedFieldCount,
                optimizeRecordData: parent.optimizeRecordData,
                freezeData: parent.freezeData,
                retainRaw: parent.retainRaw,
                reuseRecords: parent.reuseRecords,
                internStrings: parent.internStrings,
                stream: parent.useStreaming,
                tree: parent.tree,
                summary: parent.showSummary,
                populateExtraFields: parent.populateExtraFields,
                xss: parent.enableXssProtection,
                heapMin: isEmpty(heaps) ? null : min(heaps),
                heapMed,
                heapMax: isEmpty(heaps) ? null : max(heaps),
                bytesPerRecord: heapMed != null && records ? Math.round(heapMed / records) : null,
                loadMin: min(loads),
                loadMed: median(loads),
                loadMax: max(loads)
            },
            ...this.results
        ].slice(0, MAX_RESULTS);
    }

    @action
    private setStatus(status: string) {
        this.status = status;
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
                    {name: 'scenario', type: FT.STRING},
                    {name: 'gcMode', type: FT.STRING},
                    {name: 'iterations', type: FT.INT},
                    {name: 'records', type: FT.INT},
                    {name: 'declaredFields', type: FT.INT},
                    {name: 'populatedFields', type: FT.INT},
                    {name: 'optimizeRecordData', type: FT.BOOL},
                    {name: 'freezeData', type: FT.BOOL},
                    {name: 'retainRaw', type: FT.BOOL},
                    {name: 'reuseRecords', type: FT.BOOL},
                    {name: 'internStrings', type: FT.BOOL},
                    {name: 'stream', type: FT.BOOL},
                    {name: 'tree', type: FT.BOOL},
                    {name: 'summary', type: FT.BOOL},
                    {name: 'populateExtraFields', type: FT.BOOL},
                    {name: 'xss', type: FT.BOOL},
                    {name: 'heapMin', type: FT.NUMBER},
                    {name: 'heapMed', type: FT.NUMBER},
                    {name: 'heapMax', type: FT.NUMBER},
                    {name: 'bytesPerRecord', type: FT.NUMBER},
                    {name: 'loadMin', type: FT.NUMBER},
                    {name: 'loadMed', type: FT.NUMBER},
                    {name: 'loadMax', type: FT.NUMBER}
                ]
            },
            sortBy: 'timestamp|desc',
            sizingMode: 'compact',
            emptyText: 'No benchmark runs recorded.',
            enableExport: true,
            columns: [
                {
                    field: 'timestamp',
                    headerName: 'Run At',
                    width: 90,
                    renderer: v => fmtDateTime(v, {fmt: 'HH:mm:ss', asHtml: true})
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
                    field: 'heapMed',
                    headerName: 'Heap Δ (MB)',
                    ...mbCol,
                    width: 120
                },
                {field: 'heapMin', headerName: 'Heap Min', ...mbCol},
                {field: 'heapMax', headerName: 'Heap Max', ...mbCol},
                {
                    field: 'bytesPerRecord',
                    headerName: 'Bytes/Rec',
                    width: 110,
                    renderer: numberRenderer({precision: 0})
                },
                {field: 'loadMed', headerName: 'Load', ...msCol},
                {field: 'loadMin', headerName: 'Load Min', ...msCol},
                {field: 'loadMax', headerName: 'Load Max', ...msCol},
                {
                    field: 'records',
                    width: 100,
                    renderer: numberRenderer({precision: 0})
                },
                {field: 'declaredFields', headerName: 'Fields Decl', width: 100},
                {field: 'populatedFields', headerName: 'Fields Pop', width: 100},
                {field: 'optimizeRecordData', headerName: 'Optimize', ...boolCol},
                {field: 'freezeData', headerName: 'Freeze', ...boolCol},
                {field: 'retainRaw', headerName: 'RetainRaw', ...boolCol},
                {field: 'reuseRecords', headerName: 'Reuse', ...boolCol},
                {field: 'internStrings', headerName: 'Intern', ...boolCol},
                {field: 'stream', headerName: 'Stream', ...boolCol},
                {field: 'tree', headerName: 'Tree', ...boolCol},
                {field: 'summary', headerName: 'Summary', ...boolCol},
                {field: 'populateExtraFields', headerName: 'PopFields', ...boolCol},
                {field: 'xss', headerName: 'XSS', ...boolCol}
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

function yn(v: boolean): string {
    return v ? 'Y' : 'N';
}

function fmtInt(v: number): string {
    return v == null ? '' : Math.round(v).toLocaleString();
}

function fmtMb(v: number): string {
    return v == null ? '' : (v / 1000000).toFixed(1);
}
