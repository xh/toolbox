import {GridModel, timeCol, TreeStyle} from '@xh/hoist/cmp/grid';
import {fragment, p, pre} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {numberEditor, textEditor} from '@xh/hoist/desktop/cmp/grid';
import {fmtNumber, numberRenderer} from '@xh/hoist/format';
import {action, bindable, comparer, makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {isEmpty} from 'lodash';
import {DimensionManagerModel} from './dimensions/DimensionManagerModel';
import {LoadTimesModel} from './LoadTimesModel';
import {CubeModel} from './CubeModel';
import {QueryConfig, View} from '@xh/hoist/data';

export class CubeTestModel extends HoistModel {
    @managed cubeModel: CubeModel;
    @managed @observable.ref gridModel: GridModel;
    @managed @observable.ref view: View;
    @managed dimManagerModel: DimensionManagerModel;
    @managed loadTimesModel: LoadTimesModel;

    @bindable includeGlobalAgg = true;
    @bindable includeLeaves = false;
    @bindable.ref fundFilter: string[] = null;
    @bindable showSummary = false;
    @bindable updateFreq = -1;
    @bindable updateCount = 5;

    /** Zero-copy Store mode under test (hoist-react #4506). Rebuilds grid + view when toggled. */
    @bindable adoptRawData = false;

    /** Replication factor applied to fetched orders, to stress-test the Cube path at scale. */
    @bindable recordMultiplier = 1;

    /** Last sampled JS heap in MB (via measureMemory). */
    @observable heapMB: number = null;

    /** True if the last heap sample was taken without --expose-gc (coarse, directional only). */
    @observable heapImprecise = false;

    constructor() {
        super();
        makeObservable(this);
        this.loadTimesModel = new LoadTimesModel();
        this.cubeModel = new CubeModel(this);

        this.dimManagerModel = new DimensionManagerModel({
            dimensions: this.cubeModel.cube.dimensions,
            defaultDimConfig: 'cubeTestDefaultDims',
            userDimPref: 'cubeTestUserDims'
        });

        this.buildGridAndView();

        this.addReaction({
            track: () => this.getQuery(),
            run: () => this.executeQueryAsync(),
            equals: comparer.structural
        });

        // Rebuild grid + connected view when toggling adoptRawData, reconstructing the underlying
        // Store in the new mode for A/B comparison of memory and update performance.
        this.addReaction({
            track: () => this.adoptRawData,
            run: () => this.buildGridAndView()
        });
    }

    // (Re)create the grid and its connected View. The View's connect-time fullUpdate repopulates
    // the fresh Store from current Cube data, so a rebuild after load needs no explicit reload.
    private buildGridAndView() {
        XH.safeDestroy(this.view);
        XH.safeDestroy(this.gridModel);
        this.gridModel = this.createGridModel();
        this.view = this.cubeModel.cube.createView({
            query: this.getQuery(),
            stores: this.gridModel.store,
            connect: true
        });
    }

    /** GC (if exposed) and sample the JS heap for a memory read. */
    @action
    measureMemory() {
        const w = window as any,
            hasGC = typeof w.gc === 'function',
            mem = (performance as any).memory;

        // window.gc is only present with --js-flags=--expose-gc, and is the detectable proxy for
        // having launched with the memory flags. Without it we can't force GC before sampling, so
        // the reading includes uncollected garbage and is only directional - warn the developer.
        this.heapImprecise = !hasGC;
        if (hasGC) {
            w.gc();
            w.gc();
        } else {
            XH.alert({
                title: 'Imprecise memory reading',
                message: fragment(
                    p('For accurate heap capture, relaunch Chrome/Chromium with:'),
                    pre('--js-flags=--expose-gc --enable-precise-memory-info'),
                    p(
                        '--expose-gc lets this tester force garbage collection before sampling; ' +
                            '--enable-precise-memory-info removes heap-size quantization. Without ' +
                            'them the reading below includes uncollected garbage and is only a rough ' +
                            'directional figure - use Chrome DevTools heap snapshots for exact numbers.'
                    )
                )
            });
        }

        this.heapMB = mem ? Math.round(mem.usedJSHeapSize / 1048576) : null;
        const mode = this.adoptRawData ? 'adopt' : 'legacy';
        console.log(
            `[CubeTest] heap: ${this.heapMB ?? 'n/a'} MB | mode=${mode} | x${this.recordMultiplier}` +
                (hasGC
                    ? ''
                    : ' (imprecise - relaunch with --js-flags=--expose-gc --enable-precise-memory-info)')
        );
    }

    private get fields() {
        let {fields} = this.cubeModel.cube;
        if (!this.includeGlobalAgg) fields = fields.filter(f => f.name !== 'pctCommission');
        return fields.map(f => f.name);
    }

    private getQuery(): QueryConfig {
        const {fields, dimManagerModel, fundFilter, includeLeaves} = this,
            dimensions = dimManagerModel.value,
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
            {gridModel, loadObserver, showSummary} = this,
            query = this.getQuery(),
            dimCount = query.dimensions.length,
            filterCount = (query.filter as PlainObject)?.value?.length ?? 0; // Any filter is a FieldFilter with [] of Funds

        // Query is initialized with empty dims and is triggering an initial run we don't need.
        if (!dimCount) return;

        return wait()
            .then(async () => {
                const {store} = gridModel;
                gridModel.showSummary = showSummary;
                store.setLoadRootAsSummary(showSummary);

                await LTM.withLoadTime(
                    `Query | ${dimCount} dims | ${filterCount} fund filters`,
                    async () => {
                        this.view.updateQuery(this.getQuery());
                    }
                );
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
                adoptRawData: this.adoptRawData,
                fields: [{name: 'cubeDimension', type: 'string'}]
            },
            sortBy: 'time|desc',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            levelLabels: () => {
                const {dimManagerModel} = this,
                    {groupingChooserModel} = dimManagerModel,
                    groupings = dimManagerModel.value;
                return groupings.map((it: string) => groupingChooserModel.getDimDisplayName(it));
            },
            // Editing routes through Cube.modifyRecordsAsync (source of record). Disabled in
            // adoptRawData mode, which is a read-only projection.
            colDefaults: this.adoptRawData
                ? {editable: false}
                : {
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
                    // Complex-renderer contrast column (Hoist force-refreshes these each update,
                    // vs. simple columns which ride ag-Grid's own change detection). Verifies the
                    // zero-copy path repaints both. Reuses `commission`; needs a distinct colId.
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
