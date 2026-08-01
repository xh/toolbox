import {GridModel} from '@xh/hoist/cmp/grid';
import {PivotDataModel, PivotGridModel, PivotQuery} from '@xh/hoist/cmp/pivotgrid';
import {HoistModel, managed, PlainObject, TaskObserver, XH} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {isEmpty, sum} from 'lodash';
import {
    denseCellCount,
    fieldSpecs,
    generateLeaves,
    getProfile,
    pivotPathCount,
    PivotProfile,
    PROFILES,
    tickLeaves
} from './PivotBenchData';

export interface BenchResult {
    id: string;
    profileId: string;
    label: string;

    // Shape
    leaves: number;
    groupRows: number;
    pivotPaths: number;
    valueFields: number;
    denseCells: number;

    /** Synthetic `(pivotPath, valueField)` fields the prototype widens each leaf with. */
    syntheticFields: number;

    // Timing
    /** `PivotDataModel.update()` alone - pivot metadata, widening, Cube build, query. */
    dataBuildMs: number;
    /** End-to-end `PivotGridModel.loadData()` - data build plus store fields, columns, grid load. */
    gridBuildMs: number;
    /** Median end-to-end time for a values-only tick touching `tickCount` leaves. */
    tickMs: number;
    tickCount: number;

    // Memory
    heapMB: number;

    // Gate
    gateBuildMs: number;
    gateTickMs: number;
    passed: boolean;
}

/** What a single profile run measures, in order. */
type Stage = 'generate' | 'warmup' | 'dataBuild' | 'gridBuild' | 'tick' | 'heap';

export class PivotBenchModel extends HoistModel {
    @managed resultsGridModel: GridModel;
    @managed runTask = TaskObserver.trackLast();

    /** Live PivotGrid under test - rebuilt per profile so column structure matches. */
    @observable.ref @managed pivotGridModel: PivotGridModel = null;

    /** Ticks timed per run; the reported figure is the median, to drop first-run noise. */
    @bindable tickReps = 5;

    /** Fraction of leaves perturbed per tick, as a percent. */
    @bindable tickPct = 1;

    /** True to render the live grid. Off by default - grid render is not what we are measuring. */
    @bindable showGrid = false;

    @observable.ref status = 'Pick a profile and run.';
    @observable heapAvailable = false;
    @observable running = false;

    private resultSeq = 0;

    constructor() {
        super();
        makeObservable(this);
        this.heapAvailable = hasHeapTooling();
        this.resultsGridModel = this.createResultsGridModel();
    }

    //------------------------
    // Actions
    //------------------------
    runProfile(profileId: string) {
        const profile = getProfile(profileId);
        if (profile.optIn) {
            XH.confirm({
                title: `Run ${profile.label}?`,
                message: profile.description,
                confirmProps: {text: 'Run it', intent: 'warning'},
                onConfirm: () => this.runAsync([profile])
            });
        } else {
            this.runAsync([profile]);
        }
    }

    /** Run every profile except the opt-in ones. */
    runAll() {
        this.runAsync(PROFILES.filter(it => !it.optIn));
    }

    /**
     * Run the named profiles and resolve when done, skipping the opt-in confirm. The awaitable
     * entry point - for driving the bench from a script rather than the toolbar.
     */
    async runByIdsAsync(profileIds: string[]): Promise<BenchResult[]> {
        await this.doRunAsync(profileIds.map(getProfile));
        return this.results;
    }

    /** Results collected so far, oldest first. */
    get results(): BenchResult[] {
        return this.resultsGridModel.store.records.map(it => it.data as BenchResult);
    }

    @action
    clearResults() {
        this.resultsGridModel.clear();
        this.resultSeq = 0;
    }

    //------------------------
    // Implementation
    //------------------------
    private runAsync(profiles: PivotProfile[]): Promise<void> {
        return this.doRunAsync(profiles).linkTo(this.runTask).catchDefault();
    }

    @action
    private async doRunAsync(profiles: PivotProfile[]) {
        this.running = true;
        try {
            for (const profile of profiles) {
                await this.runOneAsync(profile);
            }
            this.setStatus(
                profiles.length === 1
                    ? `${profiles[0].label} complete.`
                    : `All ${profiles.length} profiles complete.`
            );
        } finally {
            this.setRunning(false);
        }
    }

    private async runOneAsync(profile: PivotProfile) {
        const {label, leaves: leafCount} = profile,
            tickCount = Math.max(1, Math.round((leafCount * this.tickPct) / 100));

        // Tear down the prior run's grid before generating - the prototype leaks a Cube per update
        // (see the plan doc's ticking blockers), so a stale model left resident would distort both
        // the heap baseline and, via GC pressure, the timings.
        this.teardownGrid();
        await this.settleAsync();

        this.setStatus(this.stageMsg(profile, 'generate'));
        await wait(50);
        const leaves = generateLeaves(profile);

        // Warm up on a small slice and discard. Without this the first timed build absorbs JIT and
        // first-call costs for the whole pivot path, which showed up as a "data build" measuring
        // slower than the "grid build" that contains it.
        this.setStatus(this.stageMsg(profile, 'warmup'));
        await wait(50);
        const warmup = new PivotDataModel();
        warmup.update(leaves.slice(0, Math.min(2000, leaves.length)), this.buildQuery(profile));
        XH.safeDestroy(warmup);

        await this.settleAsync();
        const heapBefore = await this.sampleHeapAsync();

        // 1. Data layer alone, on a throwaway model - isolates pivot metadata + widening + Cube
        //    build + query from everything the grid does with the result.
        this.setStatus(this.stageMsg(profile, 'dataBuild'));
        await wait(50);
        const dataModel = new PivotDataModel(),
            query = this.buildQuery(profile),
            t0 = performance.now();
        dataModel.update(leaves, query);
        const dataBuildMs = Math.round(performance.now() - t0),
            groupRows = countRows(dataModel.data),
            syntheticFields = dataModel.pivotedValueFields.length;

        XH.safeDestroy(dataModel);
        await this.settleAsync();

        // 2. End-to-end through PivotGridModel - adds Store field replacement, column building and
        //    the grid load on top of the same data build.
        this.setStatus(this.stageMsg(profile, 'gridBuild'));
        await wait(50);
        const gridModel = this.buildGridModel(profile);
        this.setPivotGridModel(gridModel);
        await wait();

        const t1 = performance.now();
        gridModel.loadData(leaves);
        await wait();
        const gridBuildMs = Math.round(performance.now() - t1);

        this.setStatus(this.stageMsg(profile, 'heap'));
        await this.settleAsync();
        const heapAfter = await this.sampleHeapAsync(),
            heapMB =
                heapBefore != null && heapAfter != null
                    ? Math.round((heapAfter - heapBefore) * 10) / 10
                    : null;

        // 3. Ticks. The prototype has no incremental path, so each of these is a full rebuild -
        //    which is exactly the baseline finding. Median across reps drops first-run noise.
        this.setStatus(this.stageMsg(profile, 'tick'));
        const tickTimes: number[] = [];
        for (let i = 0; i < this.tickReps; i++) {
            tickLeaves(leaves, tickCount);
            await wait(50);
            const t2 = performance.now();
            gridModel.loadData(leaves);
            await wait();
            tickTimes.push(performance.now() - t2);
        }
        const tickMs = Math.round(median(tickTimes));

        const {gate} = profile,
            passed = gate ? dataBuildMs <= gate.buildMs && tickMs <= gate.tickMs : null;

        this.addResult({
            id: `r${++this.resultSeq}`,
            profileId: profile.id,
            label,
            leaves: leafCount,
            groupRows,
            pivotPaths: pivotPathCount(profile),
            valueFields: profile.valueFields.length,
            denseCells: denseCellCount(profile, groupRows),
            syntheticFields,
            dataBuildMs,
            gridBuildMs,
            tickMs,
            tickCount,
            heapMB,
            gateBuildMs: gate?.buildMs ?? null,
            gateTickMs: gate?.tickMs ?? null,
            passed
        });

        if (!this.showGrid) this.teardownGrid();
    }

    private buildQuery(profile: PivotProfile): PivotQuery {
        const {groupBy, pivotBy, valueFields} = profile;
        return {
            fields: fieldSpecs(profile),
            groupBy,
            pivotBy,
            valueFields,
            includeSummaryRow: true
        };
    }

    private buildGridModel(profile: PivotProfile): PivotGridModel {
        const {groupBy, pivotBy, valueFields} = profile;
        return new PivotGridModel({
            fields: fieldSpecs(profile),
            groupBy,
            pivotBy,
            valueFields,
            // Row totals (the docked "Total" column) and value totals (the docked totals row) are
            // standard features, so both are on. Extra row/value total fields are deliberately left
            // off - that surface is client-specific and may not survive the phase 3 feature cut.
            showSummaryColumn: true,
            showSummaryRow: true
        });
    }

    @action
    private setPivotGridModel(model: PivotGridModel) {
        this.pivotGridModel = model;
    }

    private teardownGrid() {
        XH.safeDestroy(this.pivotGridModel);
        this.setPivotGridModel(null);
    }

    private stageMsg(profile: PivotProfile, stage: Stage): string {
        const msgs: Record<Stage, string> = {
            generate: `generating ${profile.leaves.toLocaleString()} leaves...`,
            warmup: 'warming up...',
            dataBuild: 'building pivot data...',
            gridBuild: 'building grid...',
            tick: `ticking x${this.tickReps}...`,
            heap: 'sampling heap...'
        };
        return `${profile.label}: ${msgs[stage]}`;
    }

    /** GC (if exposed) and sample the JS heap, in MB. Null when the tooling is unavailable. */
    private async sampleHeapAsync(): Promise<number> {
        if (!this.heapAvailable) return null;

        const w = window as any;
        for (let i = 0; i < 3; i++) {
            w.gc();
            await wait(30);
        }

        const mem = (performance as any).memory;
        return Math.round((mem.usedJSHeapSize / 1048576) * 10) / 10;
    }

    /** Yield long enough for teardown, reactions, and detached DOM to become collectible. */
    private async settleAsync() {
        await wait(100);
    }

    @action
    private addResult(result: BenchResult) {
        this.resultsGridModel.store.addRecords(result);
        console.log(
            `[PivotBench] ${result.label} | ${result.leaves.toLocaleString()} leaves -> ` +
                `${result.groupRows.toLocaleString()} rows x ${result.pivotPaths} paths x ` +
                `${result.valueFields} values = ${result.denseCells.toLocaleString()} dense cells | ` +
                `${result.syntheticFields.toLocaleString()} synthetic fields | ` +
                `data ${result.dataBuildMs}ms | grid ${result.gridBuildMs}ms | ` +
                `tick ${result.tickMs}ms | heap ${result.heapMB ?? 'n/a'}MB`
        );
    }

    @action
    private setStatus(status: string) {
        this.status = status;
    }

    @action
    private setRunning(running: boolean) {
        this.running = running;
    }

    private createResultsGridModel(): GridModel {
        const int = numberRenderer({precision: 0}),
            ms = numberRenderer({precision: 0});

        return new GridModel({
            store: {
                fields: [
                    {name: 'profileId', type: 'string'},
                    {name: 'label', type: 'string'},
                    {name: 'leaves', type: 'int'},
                    {name: 'groupRows', type: 'int'},
                    {name: 'pivotPaths', type: 'int'},
                    {name: 'valueFields', type: 'int'},
                    {name: 'denseCells', type: 'int'},
                    {name: 'syntheticFields', type: 'int'},
                    {name: 'dataBuildMs', type: 'int'},
                    {name: 'gridBuildMs', type: 'int'},
                    {name: 'tickMs', type: 'int'},
                    {name: 'tickCount', type: 'int'},
                    {name: 'heapMB', type: 'number'},
                    {name: 'gateBuildMs', type: 'int'},
                    {name: 'gateTickMs', type: 'int'},
                    {name: 'passed', type: 'bool'}
                ]
            },
            emptyText: 'No runs yet.',
            sizingMode: 'compact',
            rowBorders: true,
            stripeRows: true,
            columns: [
                {field: 'label', headerName: 'Profile', width: 130, pinned: true},
                {
                    groupId: 'shape',
                    headerName: 'Shape',
                    headerAlign: 'center',
                    children: [
                        {field: 'leaves', headerName: 'Leaves', width: 90, renderer: int},
                        {field: 'groupRows', headerName: 'Rows', width: 90, renderer: int},
                        {field: 'pivotPaths', headerName: 'Paths', width: 75, renderer: int},
                        {field: 'valueFields', headerName: 'Values', width: 75},
                        {
                            field: 'denseCells',
                            headerName: 'Dense cells',
                            width: 110,
                            renderer: int,
                            headerTooltip: 'rows x paths x values - the work the prototype does.'
                        },
                        {
                            field: 'syntheticFields',
                            headerName: 'Synth fields',
                            width: 110,
                            renderer: int,
                            headerTooltip:
                                'Synthetic (pivotPath, valueField) fields the prototype widens ' +
                                'each leaf with, and which its Cube then aggregates densely.'
                        }
                    ]
                },
                {
                    groupId: 'timing',
                    headerName: 'Timing',
                    headerAlign: 'center',
                    children: [
                        {
                            field: 'dataBuildMs',
                            headerName: 'Data build',
                            width: 100,
                            renderer: ms,
                            headerTooltip: 'PivotDataModel.update() alone.'
                        },
                        {
                            field: 'gridBuildMs',
                            headerName: 'Grid build',
                            width: 100,
                            renderer: ms,
                            headerTooltip:
                                'End-to-end PivotGridModel.loadData() - data build plus store ' +
                                'fields, column building and grid load. Excludes async autosize.'
                        },
                        {
                            field: 'tickMs',
                            headerName: 'Tick (med)',
                            width: 100,
                            renderer: ms,
                            headerTooltip: 'Median end-to-end time for a values-only tick.'
                        },
                        {field: 'tickCount', headerName: 'Tick recs', width: 90, renderer: int}
                    ]
                },
                {
                    field: 'heapMB',
                    headerName: 'Heap Δ (MB)',
                    width: 110,
                    align: 'right',
                    renderer: v => (v == null ? 'n/a' : numberRenderer({precision: 1})(v)),
                    headerTooltip:
                        'Retained by the pivot layer, over the generated leaves. Requires Chrome ' +
                        'launched with --js-flags=--expose-gc --enable-precise-memory-info.'
                },
                {
                    field: 'passed',
                    headerName: 'Gate',
                    width: 110,
                    align: 'center',
                    renderer: (v, {record}) => {
                        const {gateBuildMs, gateTickMs} = record.data;
                        if (gateBuildMs == null) return '—';
                        return v ? '✓ pass' : `✗ (${gateBuildMs}/${gateTickMs}ms)`;
                    },
                    headerTooltip:
                        'Pass/fail against the profile gate. Profiles without a gate are tracked ' +
                        'only. See docs/planning/pivot-grid.md in hoist-react.'
                }
            ]
        });
    }
}

/** Recursively count rows in a pivot data tree. */
function countRows(rows: PlainObject[]): number {
    if (isEmpty(rows)) return 0;
    return rows.length + sum(rows.map(it => countRows(it.children)));
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b),
        mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Heap deltas are meaningless without forced GC and unquantized readings. */
export function hasHeapTooling(): boolean {
    return typeof (window as any).gc === 'function' && !!(performance as any).memory;
}
