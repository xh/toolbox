import {GridModel} from '@xh/hoist/cmp/grid';
import {PivotGridModel} from '@xh/hoist/cmp/pivotgrid';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {Cube, CubeFieldSpec, PivotView, Store, View} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {generateLeaves, PivotProfile} from './PivotBenchData';

/**
 * Comprehensive performance and memory matrix for `PivotView` / `PivotGridModel`, with a plain
 * `View` + `GridModel` control at comparable record width.
 *
 * Read the reported numbers with three caveats, all of them earned the hard way:
 *
 * - **The tab must stay foreground and unoccluded.** A hidden tab does not fail loudly - it inflates
 *   every figure. `visibleThroughout` on each row is the tripwire; a false there voids the row.
 * - **Heap requires `--enable-precise-memory-info` and `--js-flags=--expose-gc`.** Without them
 *   `performance.memory` is quantized and refreshed lazily, and the same allocation can report
 *   +18MB or -0.2MB. `heapAvailable` reports whether the numbers mean anything.
 * - **The first config of a session runs slowest.** `warmup` runs one throwaway pass before
 *   recording anything.
 */

/** Dimension pools, disjoint by axis - `PivotQuery` rejects a field used as both. */
const GROUP_DIMS: Array<[string, number]> = [
        ['fund', 12],
        ['strategy', 25],
        ['sector', 13],
        ['desk', 0] // 0 = unique per leaf, i.e. the drill-down case
    ],
    PIVOT_DIMS: Array<[string, number]> = [
        ['regionCore', 4],
        ['assetClass', 6],
        ['tenor', 3]
    ],
    BASE_MEASURES = ['pnl', 'mktVal', 'quantity'];

/** Record width for the plain-View control - a realistically wide grid-backing record. */
const CONTROL_EXTRA_MEASURES = 22;

export interface PerfConfig {
    id: string;
    label: string;
    /** Which sweep this row belongs to, for grouping the results grid. */
    axis: string;
    leaves: number;
    groupDims: number;
    /** 0 for the plain-View control. */
    pivotDims: number;
    valueFields: number;
    /** Widen the record with `m0..mN` measures - the control's whole point. */
    extraMeasures?: number;
}

const BASE = {leaves: 100000, groupDims: 3, pivotDims: 2, valueFields: 1};

function cfg(id: string, label: string, axis: string, over: Partial<PerfConfig> = {}): PerfConfig {
    return {id, label, axis, ...BASE, ...over};
}

/**
 * One baseline, then each axis swept independently. A full cross product is ~54 configs and answers
 * no question the sweeps do not.
 */
export const PERF_CONFIGS: PerfConfig[] = [
    cfg('base', 'Baseline: 100k / 3 group / 2 pivot / 1 value', 'Baseline'),

    cfg('leaves25k', '25k leaves', 'Leaf count', {leaves: 25000}),
    cfg('leaves250k', '250k leaves', 'Leaf count', {leaves: 250000}),

    cfg('group2', '2 group dims', 'Group dims', {groupDims: 2}),
    cfg('group4drill', '4 group dims (leaf drill-down)', 'Group dims', {groupDims: 4}),

    cfg('pivot1', '1 pivot dim (4 paths)', 'Pivot dims', {pivotDims: 1}),
    cfg('pivot3', '3 pivot dims (72 paths)', 'Pivot dims', {pivotDims: 3}),

    cfg('values3', '3 value fields', 'Value fields', {valueFields: 3}),

    cfg('control', `Plain View control (${CONTROL_EXTRA_MEASURES + 3} fields, no pivots)`, 'Control', {
        pivotDims: 0,
        extraMeasures: CONTROL_EXTRA_MEASURES
    }),
    cfg('controlSmall', 'Plain View control - 25k leaves', 'Control', {
        leaves: 25000,
        pivotDims: 0,
        extraMeasures: CONTROL_EXTRA_MEASURES
    })
];

export interface PerfResult extends PlainObject {
    id: string;
}

export class PivotPerfModel extends HoistModel {
    /** Measure each config twice - data layer alone, then with a GridModel bound. */
    @bindable withGrid = true;
    @bindable withoutGrid = true;
    /** Reps for the repeatable metrics (ticks). Structural ops are single-shot by nature. */
    @bindable reps = 3;

    @observable running = false;
    @observable status: string = null;

    private seq = 0;

    get heapAvailable(): boolean {
        return typeof globalThis.gc === 'function' && !!(performance as any).memory;
    }

    @managed
    gridModel: GridModel = new GridModel({
        store: {idSpec: 'id', fields: [{name: 'visibleThroughout', type: 'bool'}]},
        groupBy: 'axis',
        emptyText: 'Run the matrix to see results.',
        sizingMode: 'compact',
        columns: [
            {field: 'axis', hidden: true},
            {field: 'label', headerName: 'Config', width: 260},
            {field: 'mode', headerName: 'Mode', width: 90},
            {field: 'rows', headerName: 'Rows', width: 85, align: 'right'},
            {field: 'cells', headerName: 'Cells', width: 85, align: 'right'},
            {field: 'cols', headerName: 'Cols', width: 65, align: 'right'},
            {
                groupId: 'build',
                headerName: 'Build ms',
                headerAlign: 'center',
                children: [
                    {field: 'cubeMs', headerName: 'Cube', width: 75, align: 'right', renderer: ms0},
                    {field: 'viewMs', headerName: 'View', width: 75, align: 'right', renderer: ms0},
                    {field: 'gridMs', headerName: 'Grid', width: 75, align: 'right', renderer: ms0}
                ]
            },
            {
                groupId: 'ticks',
                headerName: 'Delta tick ms (% of leaves changed)',
                headerAlign: 'center',
                children: [
                    {field: 'tick5', headerName: '5%', width: 70, align: 'right', renderer: ms1},
                    {field: 'tick10', headerName: '10%', width: 70, align: 'right', renderer: ms1},
                    {field: 'tick25', headerName: '25%', width: 70, align: 'right', renderer: ms1},
                    {field: 'tick50', headerName: '50%', width: 70, align: 'right', renderer: ms1}
                ]
            },
            {
                groupId: 'structural',
                headerName: 'Structural ms',
                headerAlign: 'center',
                children: [
                    {field: 'groupChangeMs', headerName: 'Group dim', width: 95, align: 'right', renderer: ms0},
                    {field: 'pivotChangeMs', headerName: 'Pivot dim', width: 95, align: 'right', renderer: ms0},
                    {field: 'valueChangeMs', headerName: 'Value fld', width: 90, align: 'right', renderer: ms0},
                    {field: 'filterMs', headerName: 'Filter', width: 80, align: 'right', renderer: ms0},
                    {field: 'newValueMs', headerName: 'New pivot val', width: 110, align: 'right', renderer: ms0},
                    {field: 'setColumnsMs', headerName: 'setColumns', width: 100, align: 'right', renderer: ms1}
                ]
            },
            {
                groupId: 'heap',
                headerName: 'Heap MB',
                headerAlign: 'center',
                children: [
                    {field: 'heapCubeMB', headerName: 'Cube', width: 80, align: 'right', renderer: ms1},
                    {field: 'heapViewMB', headerName: '+View', width: 80, align: 'right', renderer: ms1},
                    {field: 'heapGridMB', headerName: '+Grid', width: 80, align: 'right', renderer: ms1}
                ]
            },
            {
                field: 'visibleThroughout',
                headerName: 'Valid',
                width: 65,
                align: 'center',
                renderer: v => (v ? '✓' : '✗ hidden')
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    async runAllAsync() {
        await this.runConfigsAsync(PERF_CONFIGS);
    }

    async runConfigAsync(id: string) {
        await this.runConfigsAsync(PERF_CONFIGS.filter(it => it.id === id));
    }

    //------------------------
    // Implementation
    //------------------------

    private async runConfigsAsync(configs: PerfConfig[]) {
        runInAction(() => (this.running = true));
        try {
            // The first pass of a session is measurably slower - burn one before recording.
            this.note('Warming up...');
            await this.measureAsync(
                {...PERF_CONFIGS[0], leaves: 10000, id: 'warmup', label: 'warmup'},
                false
            );

            for (const config of configs) {
                if (this.withoutGrid) {
                    this.note(`${config.label} - data layer`);
                    this.record(await this.measureAsync(config, false));
                }
                if (this.withGrid) {
                    this.note(`${config.label} - with grid`);
                    this.record(await this.measureAsync(config, true));
                }
            }
            this.note(null);
            XH.toast({message: 'Matrix complete', intent: 'success'});
        } catch (e) {
            XH.handleException(e);
        } finally {
            runInAction(() => (this.running = false));
        }
    }

    private async measureAsync(config: PerfConfig, withGrid: boolean): Promise<PerfResult> {
        const {leaves: leafCount, groupDims, pivotDims, valueFields, extraMeasures} = config,
            groupBy = GROUP_DIMS.slice(0, groupDims).map(d => d[0]),
            pivotBy = PIVOT_DIMS.slice(0, pivotDims).map(d => d[0]),
            measures = [...BASE_MEASURES, ...range(extraMeasures ?? 0).map(i => `m${i}`)],
            values = BASE_MEASURES.slice(0, valueFields);

        const profile = {
            id: config.id,
            label: config.label,
            leaves: leafCount,
            dims: Object.fromEntries([...GROUP_DIMS, ...PIVOT_DIMS]),
            groupBy,
            pivotBy,
            valueFields: values,
            extraMeasures,
            description: ''
        } as PivotProfile;

        let hidden = false;
        const onHide = () => (hidden = hidden || document.hidden);
        document.addEventListener('visibilitychange', onHide);

        const fields: CubeFieldSpec[] = [
            ...[...GROUP_DIMS, ...PIVOT_DIMS].map(([name]) => ({
                name,
                type: 'string' as const,
                isDimension: true
            })),
            ...measures.map(name => ({name, type: 'number' as const, aggregator: 'SUM' as const}))
        ];

        const leaves = generateLeaves(profile),
            queryBase = {
                dimensions: groupBy,
                fields: fields.map(f => f.name),
                includeRoot: true,
                omitRedundantNodes: false
            };

        const heapBase = await this.sampleHeapAsync();

        // 1. Cube load.
        const cube = new Cube({fields, idSpec: 'id'});
        const cubeMs = await timeAsync(() => cube.loadDataAsync(leaves));
        const heapCube = await this.sampleHeapAsync();

        // 2. View creation.
        let view: View | PivotView;
        const viewMs = time(() => {
            view = pivotDims
                ? cube.createPivotView({
                      query: {...queryBase, pivotDimensions: pivotBy, valueFields: values, maxPivotPaths: null},
                      connect: true
                  })
                : cube.createView({query: queryBase, connect: true});
        });
        const heapView = await this.sampleHeapAsync();

        // 3. Grid layer - PivotGridModel mints and loads its own store; the control builds the
        //    equivalent by hand so the comparison includes the same Store work.
        let pivotGrid: PivotGridModel, controlGrid: GridModel, controlStore: Store;
        let gridMs: number = null,
            setColumnsMs: number = null;

        if (withGrid) {
            gridMs = time(() => {
                if (pivotDims) {
                    pivotGrid = new PivotGridModel({
                        view: view as PivotView,
                        rowSummary: 'right',
                        gridConfig: {autosizeOptions: {mode: 'disabled'}}
                    });
                } else {
                    controlStore = new Store({
                        idSpec: 'id',
                        loadTreeData: true,
                        projectionOnly: true,
                        fields: [
                            {name: 'cubeLabel', type: 'string'},
                            {name: 'cubeDimension', type: 'string'},
                            ...measures.map(name => ({name, type: 'number' as const}))
                        ]
                    });
                    view.setStores(controlStore);
                    controlGrid = new GridModel({
                        store: controlStore,
                        treeMode: true,
                        autosizeOptions: {mode: 'disabled'},
                        columns: [
                            {field: 'cubeLabel', isTreeColumn: true, width: 200},
                            ...measures.map(name => ({field: name, width: 100}))
                        ]
                    });
                }
            });

            const gm = pivotGrid?.gridModel ?? controlGrid,
                cols = pivotGrid ? null : (controlGrid as any);
            void cols;
            setColumnsMs = time(() => gm.setColumns(gm.columns.map(toSpec)));
        }
        const heapGrid = withGrid ? await this.sampleHeapAsync() : null;

        // Captured here - the structural probes below deliberately add paths and would inflate them.
        const shape = {
            rows: countRows(view),
            cells: pivotDims ? (view as PivotView).result.cellFields.length : null,
            cols: withGrid ? (pivotGrid?.gridModel ?? controlGrid).getLeafColumns().length : null
        };

        // 4. Delta ticks at four magnitudes, median of `reps`.
        const tick = async (pct: number) => {
            const n = Math.max(1, Math.round((leafCount * pct) / 100)),
                times: number[] = [];
            for (let r = 0; r < this.reps; r++) {
                const changed = perturb(leaves, n, r);
                times.push(await timeAsync(() => cube.updateDataAsync({update: changed})));
                await wait(1);
            }
            return median(times);
        };
        const tick5 = await tick(5),
            tick10 = await tick(10),
            tick25 = await tick(25),
            tick50 = await tick(50);

        // 5. Structural transitions - each single-shot, since each changes the state it measures.
        const filterMs = await timeAsync(async () =>
            view.setFilter({field: 'pnl', op: '>', value: -1e9})
        );

        const groupChangeMs = await timeAsync(async () =>
            view.updateQuery({dimensions: groupBy.slice(0, Math.max(1, groupDims - 1))})
        );
        view.updateQuery({dimensions: groupBy});

        let pivotChangeMs: number = null,
            valueChangeMs: number = null,
            newValueMs: number = null;

        if (pivotDims) {
            const pv = view as PivotView;
            pivotChangeMs = await timeAsync(async () =>
                pv.updateQuery({pivotDimensions: pivotBy.slice(0, Math.max(1, pivotDims - 1))})
            );
            pv.updateQuery({pivotDimensions: pivotBy});

            if (valueFields > 1) {
                valueChangeMs = await timeAsync(async () =>
                    pv.updateQuery({valueFields: values.slice(0, valueFields - 1)})
                );
                pv.updateQuery({valueFields: values});
            }

            // A brand-new pivot value: re-declares Store fields and rebuilds columns.
            const dim = pivotBy[pivotBy.length - 1],
                touched: PlainObject[] = [];
            leaves.forEach((rec, i) => {
                if (i % 17 === 0) {
                    rec[dim] = 'ZZ-New';
                    touched.push(rec);
                }
            });
            newValueMs = await timeAsync(() => cube.updateDataAsync({update: touched}));
        }

        const result: PerfResult = {
            id: `p${++this.seq}`,
            axis: config.axis,
            label: config.label,
            mode: withGrid ? 'grid' : 'data',
            ...shape,
            cubeMs,
            viewMs,
            gridMs,
            tick5,
            tick10,
            tick25,
            tick50,
            groupChangeMs,
            pivotChangeMs,
            valueChangeMs,
            filterMs,
            newValueMs,
            setColumnsMs,
            heapCubeMB: mb(heapCube, heapBase),
            heapViewMB: mb(heapView, heapCube),
            heapGridMB: withGrid ? mb(heapGrid, heapView) : null,
            visibleThroughout: !hidden && !document.hidden
        };

        document.removeEventListener('visibilitychange', onHide);
        XH.safeDestroy(pivotGrid, controlGrid, controlStore, view, cube);
        await this.sampleHeapAsync();

        return result;
    }

    /** Settle the heap: several GC passes, since one pass leaves recently-dead objects behind. */
    private async sampleHeapAsync(): Promise<number> {
        if (!this.heapAvailable) return null;
        for (let i = 0; i < 4; i++) {
            globalThis.gc();
            await wait(60);
        }
        return (performance as any).memory.usedJSHeapSize;
    }

    private note(status: string) {
        runInAction(() => (this.status = status));
    }

    private record(result: PerfResult) {
        this.gridModel.store.updateData({add: [result]});
    }
}

//------------------------
// Helpers
//------------------------
const ms0 = numberRenderer({precision: 0}),
    ms1 = numberRenderer({precision: 1});

function range(n: number): number[] {
    return Array.from({length: n}, (_, i) => i);
}

function time(fn: () => void): number {
    const t = performance.now();
    fn();
    return performance.now() - t;
}

async function timeAsync(fn: () => Promise<any> | any): Promise<number> {
    const t = performance.now();
    await fn();
    return performance.now() - t;
}

function median(vals: number[]): number {
    const s = [...vals].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
}

function mb(after: number, before: number): number {
    return after == null || before == null ? null : (after - before) / 1048576;
}

/** Perturb `n` leaves in place, returning just those - the delta transaction. */
function perturb(leaves: PlainObject[], n: number, gen: number): PlainObject[] {
    const ret: PlainObject[] = [];
    for (let i = 0; i < n; i++) {
        const rec = leaves[(i * 7919 + gen) % leaves.length];
        rec.pnl = ((i * 31 + gen * 7) % 1000) * 250 - 100000;
        ret.push(rec);
    }
    return ret;
}

function countRows(view: View): number {
    let n = 0;
    const visit = (row: any) => {
        n++;
        row.children?.forEach(visit);
    };
    view.result.rows.forEach(visit);
    return n;
}

/** Round-trip a built Column back to a spec, so `setColumns` can be timed in isolation. */
function toSpec(col: any): any {
    return col.children
        ? {groupId: col.groupId, headerName: col.headerName, children: col.children.map(toSpec)}
        : {colId: col.colId, field: col.field, width: col.width};
}
