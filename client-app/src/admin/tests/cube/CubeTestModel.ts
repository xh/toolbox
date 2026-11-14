import {ChartModel} from '@xh/hoist/cmp/chart';
import {CubeGridModel} from '@xh/hoist/cmp/cubegrid';
import type {ColumnSpec, GridModel} from '@xh/hoist/cmp/grid';
import {time, TreeStyle} from '@xh/hoist/cmp/grid';
import {fragment} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {numberEditor, textEditor} from '@xh/hoist/desktop/cmp/grid';
import {fmtNumber, numberTextRenderer} from '@xh/hoist/format';
import {
    action,
    bindable,
    bindableRef,
    compareStructural,
    observable,
    runInAction
} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {forEach, isEmpty} from 'lodash';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {LoadTimesModel} from './LoadTimesModel';
import {CubeModel} from './CubeModel';
import type {QueryConfig, View} from '@xh/hoist/data';

export class CubeTestModel extends HoistModel {
    @managed cubeModel: CubeModel;
    @managed cubeGridModel: CubeGridModel;
    @managed groupingChooserModel: GroupingChooserModel;
    @managed loadTimesModel: LoadTimesModel;

    @bindable accessor includeGlobalAgg = false;
    @bindable accessor includeLeaves = false;
    @bindableRef accessor fundFilter: string[] = null;
    @bindable accessor showSummary = false;
    @bindable accessor updateFreq = -1;
    @bindable accessor updateCount = 5;

    /** Pivot dimensions - any also grouped on are left out of the query, as a pivot rejects them. */
    @bindableRef accessor pivotBy: string[] = [];
    @bindableRef accessor pivotMeasures: string[] = ['commission'];

    /** Grid experimental sort flags, applied live for A/B tuning. */
    @bindable accessor deferredSortFactor = 4;
    @bindable accessor deltaSortRatio = 50;

    /** Set explicitly in both directions, overriding any app-wide `xhStoreExperimental` default. */
    @bindable accessor maxPatchRatio = 0.1;

    /** Replication factor applied to fetched orders, to stress-test the Cube path at scale. */
    @bindable accessor recordMultiplier = 1;

    @bindableRef accessor logStages: string[] = [];

    /** True if launched with the memory flags - window.gc is the detectable proxy for both. */
    readonly gcAvailable = typeof (window as any).gc === 'function';

    /** Chart the GC'd JS heap on a 10s timer. Requires `gcAvailable` - disabled otherwise. */
    @bindable accessor monitorMemory = false;

    /** Last sampled heap size, shown as a label alongside the chart. */
    @observable accessor heapMB: number = null;

    @managed memoryChartModel: ChartModel;
    private memorySamples: [number, number][] = [];
    private lastMemorySample = 0;
    private memoryBaseline = 0;

    constructor() {
        super();
        this.loadTimesModel = new LoadTimesModel();
        this.cubeModel = new CubeModel(this);
        this.memoryChartModel = this.createMemoryChartModel();

        const presetDims: string[][] = XH.getConf('cubeTestDefaultDims');
        this.groupingChooserModel = new GroupingChooserModel({
            dimensions: this.cubeModel.cube.dimensions,
            initialValue: presetDims[0],
            initialFavorites: presetDims,
            persistWith: {prefKey: 'cubeTestUserDims'}
        });

        this.cubeGridModel = this.createCubeGridModel();
        this.applyMaxPatchRatio(this.maxPatchRatio);

        this.addReaction({
            track: () => this.getQuery(),
            run: () => this.executeQueryAsync(),
            equals: compareStructural
        });

        // Applied live to the existing Stores - the ratio is read on each operation.
        this.addReaction({
            track: () => this.maxPatchRatio,
            run: ratio => this.applyMaxPatchRatio(ratio)
        });

        // Applied live to the existing GridModel - the flags are read on each sort decision.
        this.addReaction({
            track: () => [this.deferredSortFactor, this.deltaSortRatio],
            run: () => this.applySortFlags()
        });

        // Re-apply on selection change, and when a rebuild installs fresh diagnostics objects.
        this.addReaction({
            track: () => [this.logStages, this.cubeModel.cube],
            run: () => this.syncDiagnosticsLogging()
        });

        // Sample the heap in the wake of each tracked load, and immediately on toggle-on.
        this.addReaction(
            {
                track: () => this.loadTimesModel.total,
                run: () => this.sampleMemoryAsync()
            },
            {
                track: () => this.monitorMemory,
                run: on => on && this.sampleMemoryAsync(false)
            }
        );
    }

    get gridModel(): GridModel {
        return this.cubeGridModel.gridModel;
    }

    get view(): View {
        return this.cubeGridModel.view;
    }

    /** Dimensions offered for pivoting - those not already grouped on. */
    get pivotDimOptions(): string[] {
        const grouped = this.groupingChooserModel.value;
        return this.cubeModel.cube.dimensions
            .map(it => it.name)
            .filter(it => !grouped.includes(it));
    }

    /** Keyed by the values offered in the logging picker. */
    private get diagnosticsByStage() {
        const {cubeModel, view, gridModel} = this;
        return {
            cubeStore: cubeModel.cube.store.diagnostics,
            view: view.diagnostics,
            gridStore: gridModel.store.diagnostics,
            grid: gridModel.diagnostics
        };
    }

    @action
    resetDiagnostics() {
        forEach(this.diagnosticsByStage, it => it.reset());
        this.loadTimesModel.clearLoadTimes();
        this.memorySamples = [];
        this.memoryChartModel.clear();
        this.heapMB = null;
    }

    private syncDiagnosticsLogging() {
        const {logStages} = this;
        forEach(this.diagnosticsByStage, (it, stage) => {
            it.logLevel = logStages.includes(stage) ? 'info' : 'debug';
        });
    }

    private applySortFlags() {
        const {experimental} = this.gridModel;
        experimental.deferredSortFactor = this.deferredSortFactor;
        experimental.deltaSortRatio = this.deltaSortRatio;
    }

    private applyMaxPatchRatio(ratio: number) {
        this.cubeModel.cube.store.experimental.maxPatchRatio = ratio;
        this.cubeGridModel.store.experimental.maxPatchRatio = ratio;
    }

    // Each sample runs a full synchronous GC so the chart tracks live heap rather than
    // uncollected garbage. Deferred a tick to let the load that triggered it paint first,
    // and throttled so a fast update stream collects at most once per 10s.
    private async sampleMemoryAsync(throttled: boolean = true) {
        if (!this.monitorMemory || !this.gcAvailable) return;
        if (throttled && Date.now() - this.lastMemorySample < 10 * SECONDS) return;

        await wait();
        if (this.loadObserver.isPending) return;

        const now = Date.now();
        this.lastMemorySample = now;
        if (isEmpty(this.memorySamples)) this.memoryBaseline = now;

        (window as any).gc();
        const mb = Math.round((performance as any).memory.usedJSHeapSize / 1048576),
            secs = Math.round((now - this.memoryBaseline) / 1000);
        this.memorySamples = [...this.memorySamples.slice(-719), [secs, mb]];
        this.memoryChartModel.setSeries([{data: this.memorySamples}]);
        runInAction(() => (this.heapMB = mb));
    }

    private createMemoryChartModel() {
        return new ChartModel({
            highchartsConfig: {
                chart: {type: 'line', animation: false},
                title: {text: null},
                legend: {enabled: false},
                // X is seconds elapsed since the series (re)started, not wall-clock time.
                xAxis: {min: 0, labels: {format: '{value}s'}},
                yAxis: {min: 0, title: {text: null}, labels: {format: '{value} MB'}},
                tooltip: {headerFormat: '', pointFormat: '{point.x}s · <b>{point.y} MB</b>'},
                plotOptions: {series: {marker: {enabled: false}, animation: false}}
            }
        });
    }

    private get fields() {
        let {fields} = this.cubeModel.cube;
        if (!this.includeGlobalAgg) fields = fields.filter(f => f.name !== 'pctCommission');
        return fields.map(f => f.name);
    }

    private getQuery(): QueryConfig {
        const {fields, groupingChooserModel, fundFilter, includeLeaves, pivotMeasures} = this,
            dimensions = groupingChooserModel.value,
            pivot = {
                dimensions: this.pivotBy.filter(it => !dimensions.includes(it)),
                measures: pivotMeasures
            },
            filter = !isEmpty(fundFilter)
                ? ({field: 'fund', op: '=', value: fundFilter} as const)
                : null,
            includeRoot = this.showSummary;

        return {fields, dimensions, filter, includeLeaves, includeRoot, pivot};
    }

    clear() {
        this.cubeModel.cube.clearAsync();
    }

    override async doLoadAsync() {
        await this.cubeModel.loadAsync();
    }

    private async executeQueryAsync() {
        const LTM = this.loadTimesModel,
            {cubeGridModel, loadObserver, showSummary} = this;

        // Query is initialized with empty dims and is triggering an initial run we don't need.
        if (!this.getQuery().dimensions.length) return;

        return wait()
            .then(async () => {
                // The Store's summary row follows the query's `includeRoot`.
                cubeGridModel.setShowSummary(showSummary);

                await LTM.withLoadTime('Query changed', async () => {
                    this.view.updateQuery(this.getQuery());
                });
            })
            .linkTo(loadObserver);
    }

    private createCubeGridModel() {
        const {cube} = this.cubeModel,
            // Edits route through the Cube, as the CubeGridModel's Store is projection-only.
            // Set per fixed column, as colDefaults would reach the pivot cells too.
            editable = (editor): Partial<ColumnSpec> => ({
                editor,
                editable: ({record}) => !record.data.cubeDimension, // Only editable if leaf node
                setValueFn: ({value, record, field}) => {
                    const data = {id: record.data.cubeLabel};
                    data[field] = value;
                    cube.modifyRecordsAsync(data);
                }
            });

        return new CubeGridModel({
            cube,
            query: this.getQuery(),
            columns: [
                {field: 'id', headerName: 'ID', width: 40, hidden: true},
                {field: 'cubeLabel', headerName: 'Name', minWidth: 180, isTreeColumn: true},
                {field: 'fund', width: 130, ...editable(textEditor)},
                {field: 'trader', width: 130, ...editable(textEditor)},
                ...PIVOT_MEASURES.map(field => ({
                    field,
                    ...MEASURE_COLUMNS[field],
                    ...editable(numberEditor)
                })),
                {
                    field: 'commission',
                    colId: 'commissionComplex',
                    headerName: 'Comm (complex)',
                    align: 'right',
                    width: 150,
                    rendererIsComplex: true,
                    renderer: v =>
                        fragment(
                            fmtNumber(v, {precision: 0, ledger: true, colorSpec: true}),
                            v >= 0 ? ' ▲' : ' ▼'
                        )
                },
                {field: 'time', ...time}
            ],
            gridConfig: {
                treeStyle: TreeStyle.HIGHLIGHTS_AND_BORDERS,
                showSummary: this.showSummary,
                experimental: {
                    deferredSortFactor: this.deferredSortFactor,
                    deltaSortRatio: this.deltaSortRatio
                },
                sortBy: 'time|desc',
                emptyText: 'No records found...',
                enableExport: true,
                showHover: true
            },
            pivotConfig: {
                measures: PIVOT_MEASURES.map(field => ({field, column: MEASURE_COLUMNS[field]}))
            }
        });
    }
}

/** Measures offered for pivoting - every aggregated field but `time`, in fixed-column order. */
export const PIVOT_MEASURES = [
    'quantity',
    'price',
    'commission',
    'pctCommission',
    'maxConfidence',
    'minConfidence'
];

/** Column config shared by each measure's fixed column and its pivot cells. */
const MEASURE_COLUMNS: Record<string, ColumnSpec> = {
    quantity: {
        align: 'right',
        width: 130,
        absSort: true,
        textRenderer: numberTextRenderer({precision: 0, ledger: true}),
        hidden: true
    },
    price: {
        align: 'right',
        width: 130,
        textRenderer: numberTextRenderer({precision: 4}),
        hidden: true
    },
    commission: {
        align: 'right',
        width: 130,
        textRenderer: numberTextRenderer({precision: 0, ledger: true})
    },
    pctCommission: {
        align: 'right',
        width: 130,
        textRenderer: numberTextRenderer({precision: 6})
    },
    maxConfidence: {
        align: 'right',
        width: 130,
        textRenderer: numberTextRenderer({precision: 0}),
        hidden: true
    },
    minConfidence: {
        align: 'right',
        width: 130,
        textRenderer: numberTextRenderer({precision: 0}),
        hidden: true
    }
};
