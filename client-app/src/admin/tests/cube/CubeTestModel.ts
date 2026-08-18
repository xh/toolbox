import {ChartModel} from '@xh/hoist/cmp/chart';
import {GridModel, timeCol, TreeStyle} from '@xh/hoist/cmp/grid';
import {fragment} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {numberEditor, textEditor} from '@xh/hoist/desktop/cmp/grid';
import {fmtNumber, numberRenderer} from '@xh/hoist/format';
import {action, bindable, comparer, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {forEach, isEmpty} from 'lodash';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {LoadTimesModel} from './LoadTimesModel';
import {CubeModel} from './CubeModel';
import {QueryConfig, View} from '@xh/hoist/data';

export class CubeTestModel extends HoistModel {
    @managed cubeModel: CubeModel;
    @managed @observable.ref gridModel: GridModel;
    @managed @observable.ref view: View;
    @managed groupingChooserModel: GroupingChooserModel;
    @managed loadTimesModel: LoadTimesModel;

    @bindable includeGlobalAgg = false;
    @bindable includeLeaves = false;
    @bindable.ref fundFilter: string[] = null;
    @bindable showSummary = false;
    @bindable updateFreq = -1;
    @bindable updateCount = 5;

    @bindable projectionOnly = true;
    @bindable reuseRecords = true;
    @bindable deltaSort = false;

    /** Set explicitly in both directions, overriding any app-wide `xhStoreExperimental` default. */
    @bindable patchableRecordSet = true;

    /** Replication factor applied to fetched orders, to stress-test the Cube path at scale. */
    @bindable recordMultiplier = 1;

    @bindable.ref logStages: string[] = [];

    /** True if launched with the memory flags - window.gc is the detectable proxy for both. */
    readonly gcAvailable = typeof (window as any).gc === 'function';

    /** Chart the GC'd JS heap on a 10s timer. Requires `gcAvailable` - disabled otherwise. */
    @bindable monitorMemory = false;

    /** Last sampled heap size, shown as a label alongside the chart. */
    @observable heapMB: number = null;

    @managed memoryChartModel: ChartModel;
    private memorySamples: [number, number][] = [];
    private lastMemorySample = 0;
    private memoryBaseline = 0;

    constructor() {
        super();
        makeObservable(this);
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

        this.buildGridAndView();

        this.addReaction({
            track: () => this.getQuery(),
            run: () => this.executeQueryAsync(),
            equals: comparer.structural
        });

        // Reconstruct the Store in the new mode, for A/B comparison.
        this.addReaction({
            track: () => [this.projectionOnly, this.reuseRecords, this.deltaSort],
            run: () => this.buildGridAndView()
        });

        // Fixed at Store construction, so the Cube must be rebuilt ahead of the grid + View.
        this.addReaction({
            track: () => this.patchableRecordSet,
            run: () => this.rebuildCubeAndViewAsync()
        });

        // Re-apply on selection change, and when a rebuild installs fresh diagnostics objects.
        this.addReaction({
            track: () => [this.logStages, this.cubeModel.cube, this.view, this.gridModel],
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

    private async rebuildCubeAndViewAsync() {
        await this.cubeModel
            .rebuildCubeAsync()
            .then(() => this.buildGridAndView())
            .linkTo(this.loadObserver);
    }

    // The View's connect-time fullUpdate repopulates the fresh Store, so needs no explicit reload.
    private buildGridAndView() {
        XH.safeDestroy(this.view);
        XH.safeDestroy(this.gridModel);
        this.gridModel = this.createGridModel();
        this.view = this.cubeModel.cube.createView({
            query: this.getQuery(),
            stores: this.gridModel.store,
            connect: true
        });
        // The View installs a reuse digest automatically - null it out for the no-reuse baseline.
        if (!this.reuseRecords) this.gridModel.store.setDigestFn(() => null);
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
        const {fields, groupingChooserModel, fundFilter, includeLeaves} = this,
            dimensions = groupingChooserModel.value,
            filter = !isEmpty(fundFilter)
                ? ({field: 'fund', op: '=', value: fundFilter} as const)
                : null,
            includeRoot = this.showSummary;

        return {fields, dimensions, filter, includeLeaves, includeRoot};
    }

    clear() {
        this.cubeModel.cube.clearAsync();
    }

    override async doLoadAsync() {
        await this.cubeModel.loadAsync();
    }

    private async executeQueryAsync() {
        const LTM = this.loadTimesModel,
            {gridModel, loadObserver, showSummary} = this;

        // Query is initialized with empty dims and is triggering an initial run we don't need.
        if (!this.getQuery().dimensions.length) return;

        return wait()
            .then(async () => {
                const {store} = gridModel;
                gridModel.showSummary = showSummary;
                store.setLoadRootAsSummary(showSummary);

                await LTM.withLoadTime('Query changed', async () => {
                    this.view.updateQuery(this.getQuery());
                });
            })
            .linkTo(loadObserver);
    }

    private createGridModel() {
        return new GridModel({
            treeMode: true,
            treeStyle: TreeStyle.HIGHLIGHTS_AND_BORDERS,
            showSummary: this.showSummary,
            store: {
                loadRootAsSummary: this.showSummary,
                projectionOnly: this.projectionOnly,
                experimental: {patchableRecordSet: this.patchableRecordSet},
                fields: [{name: 'cubeDimension', type: 'string'}]
            },
            experimental: {deltaSort: this.deltaSort},
            sortBy: 'time|desc',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            levelLabels: () => {
                const {groupingChooserModel} = this;
                return groupingChooserModel.value.map(it =>
                    groupingChooserModel.getDimDisplayName(it)
                );
            },
            // Edits route through the Cube - Store.modifyRecords throws under projectionOnly.
            colDefaults: {
                editable: ({record}) => !record.data.cubeDimension, // Only editable if leaf node
                setValueFn: ({value, record, field}) => {
                    const data = {id: record.data.cubeLabel};
                    data[field] = value;
                    this.cubeModel.cube.modifyRecordsAsync(data);
                }
            },
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    width: 40,
                    hidden: true,
                    editable: false
                },
                {
                    field: 'cubeLabel',
                    headerName: 'Name',
                    minWidth: 180,
                    isTreeColumn: true,
                    editable: false
                },
                {
                    field: 'fund',
                    editor: textEditor,
                    width: 130
                },
                {
                    field: 'trader',
                    editor: textEditor,
                    width: 130
                },
                {
                    field: 'quantity',
                    headerName: 'Qty',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    editor: numberEditor,
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true
                    }),
                    hidden: true
                },
                {
                    field: 'price',
                    align: 'right',
                    width: 130,
                    editor: numberEditor,
                    renderer: numberRenderer({
                        precision: 4
                    }),
                    hidden: true
                },
                {
                    field: 'commission',
                    align: 'right',
                    width: 130,
                    editor: numberEditor,
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true
                    })
                },
                {
                    field: 'pctCommission',
                    align: 'right',
                    width: 130,
                    editor: numberEditor,
                    renderer: numberRenderer({
                        precision: 6
                    })
                },
                {
                    field: 'maxConfidence',
                    align: 'right',
                    width: 130,
                    editor: numberEditor,
                    renderer: numberRenderer({
                        precision: 0
                    }),
                    hidden: true
                },
                {
                    field: 'minConfidence',
                    align: 'right',
                    width: 130,
                    editor: numberEditor,
                    renderer: numberRenderer({
                        precision: 0
                    }),
                    hidden: true
                },
                {
                    field: 'commission',
                    colId: 'commissionComplex',
                    headerName: 'Comm (complex)',
                    align: 'right',
                    width: 150,
                    editable: false,
                    rendererIsComplex: true,
                    renderer: v =>
                        fragment(
                            fmtNumber(v, {precision: 0, ledger: true, colorSpec: true}),
                            v >= 0 ? ' ▲' : ' ▼'
                        )
                },
                {
                    field: 'time',
                    editable: false,
                    ...timeCol
                }
            ]
        });
    }
}
