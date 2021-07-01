import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Cube} from '@xh/hoist/data';
import {GridModel, TreeStyle, ExportFormat, boolCheckCol, localDateCol} from '@xh/hoist/cmp/grid';
import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';

export class ColumnFilterPanelModel extends HoistModel {

    @bindable.ref filterJson = JSON.stringify(null);
    @bindable isCubeMode = false;

    @managed gridModel;
    @managed gridFilterChooserModel;

    @managed cube;
    @managed cubeView;
    @managed cubeGridModel;
    @managed cubeFilterChooserModel;
    @managed groupingChooserModel;

    get filter() {
        const {isCubeMode, gridModel, cubeView} = this;
        return isCubeMode ? cubeView?.filter : gridModel?.filterModel.filter;
    }

    get activeGridModel() {
        const {isCubeMode, gridModel, cubeGridModel} = this;
        return isCubeMode ? cubeGridModel : gridModel;
    }

    get activeFilterChooserModel() {
        const {isCubeMode, gridFilterChooserModel, cubeFilterChooserModel} = this;
        return isCubeMode ? cubeFilterChooserModel : gridFilterChooserModel;
    }

    get cubeQuery() {
        const {isCubeMode, groupingChooserModel, filter} = this;
        if (!isCubeMode || !groupingChooserModel) return null;
        const dimensions = groupingChooserModel.value;
        return {dimensions, filter, includeLeaves: true};
    }

    constructor() {
        super();
        makeObservable(this);

        // Setup Simple Grid mode
        this.gridModel = this.createGridModel();
        this.gridFilterChooserModel = this.createGridFilterChooserModel();

        // Setup Cube mode
        this.cube = this.createCube();
        this.cubeView = this.createCubeView();
        this.cubeGridModel = this.createCubeGridModel();
        this.cubeFilterChooserModel = this.createCubeFilterChooserModel();
        this.groupingChooserModel = this.createGroupingChooserModel();

        this.cubeView.setStores(this.cubeGridModel.store);

        // Update filter JSON
        this.addReaction({
            track: () => this.filter,
            run: (filter) => {
                const str = JSON.stringify(filter?.toJSON() ?? null, undefined, 2);
                this.setFilterJson(str);
            }
        });

        // Update cube view when query changes
        this.addReaction({
            track: () => this.cubeQuery,
            run: (query) => {
                if (query) this.cubeView.updateQuery(query);
            },
            equals: 'structural'
        });
    }

    async doLoadAsync(loadSpec) {
        return Promise.all([
            this.loadGridAsync(),
            this.loadCubeAsync(loadSpec)
        ]);
    }

    async loadGridAsync() {
        const {gridModel} = this,
            {trades, summary} = await XH.fetchJson({url: 'trade'});

        gridModel.loadData(trades, summary);
        await gridModel.preSelectFirstAsync();
    }

    async loadCubeAsync(loadSpec) {
        const orders = await XH.portfolioService.getAllOrdersAsync({loadSpec});
        await this.cube.loadDataAsync(orders, {asOf: Date.now()});
    }

    //--------------------
    // Grid Mode Implementation
    //--------------------
    createGridModel() {
        return new GridModel({
            showSummary: 'bottom',
            selModel: {mode: 'multiple'},
            sortBy: 'profit_loss|desc|abs',
            emptyText: 'No records found...',
            filterModel: true,
            colChooserModel: true,
            enableExport: true,
            exportOptions: {
                columns: ['id', 'company', 'VISIBLE'],
                filename: 'hoist-sample-export'
            },
            sizingMode: XH.appModel.gridSizingMode,
            store: {
                fields: [
                    {
                        name: 'profit_loss',
                        displayName: 'P&L',
                        type: 'number'
                    },
                    {
                        name: 'trade_date',
                        displayName: 'Date',
                        type: 'localDate'
                    },
                    {
                        name: 'trade_volume',
                        headerName: 'Volume (Sales Quantity)',
                        type: 'number'
                    },
                    {
                        name: 'active',
                        type: 'bool'
                    }
                ]
            },
            colDefaults: {
                enableFilter: true
            },
            columns: [
                {
                    field: 'id',
                    hidden: true
                },
                {
                    field: 'active',
                    ...boolCheckCol,
                    headerName: '',
                    chooserName: 'Active Status',
                    tooltip: (active, {record}) => active ? `${record.data.company} is active` : ''
                },
                {
                    field: 'company',
                    flex: 1,
                    minWidth: 200,
                    headerName: ({gridModel}) => {
                        let ret = 'Company';
                        if (gridModel.selectedRecord) {
                            ret += ` (${gridModel.selectedRecord.data.company})`;
                        }

                        return ret;
                    },
                    exportName: 'Company',
                    headerTooltip: 'Select a company & continue'
                },
                {
                    field: 'city',
                    minWidth: 150,
                    maxWidth: 200,
                    tooltip: (val, {record}) => `${record.data.company} is located in ${val}`,
                    cellClass: (val) => {
                        return val === 'New York' ? 'xh-text-color-accent' : '';
                    }
                },
                {
                    field: 'trade_volume',
                    width: 150,
                    tooltip: (val) => fmtNumberTooltip(val),
                    renderer: millionsRenderer({
                        precision: 1,
                        label: true
                    }),
                    exportFormat: ExportFormat.NUM_DELIMITED,
                    chooserDescription: 'Daily Volume of Shares (Estimated, avg. YTD)',
                    enableEnumFilter: false
                },
                {
                    field: 'profit_loss',
                    width: 150,
                    absSort: true,
                    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true,
                        colorSpec: true
                    }),
                    exportFormat: ExportFormat.LEDGER_COLOR,
                    chooserDescription: 'Annual Profit & Loss YTD (EBITDA)',
                    enableEnumFilter: false
                },
                {
                    field: 'trade_date',
                    ...localDateCol,
                    width: 150,
                    chooserDescription: 'Date of last trade (including related derivatives)'
                }
            ]
        });
    }

    createGridFilterChooserModel() {
        const {store} = this.gridModel;
        return new FilterChooserModel({
            valueSource: store,
            target: store
        });
    }

    //--------------------
    // Cube Mode Implementation
    //--------------------
    createCube() {
        const isInstrument = (dim, val, appliedDims) => {
            return !!appliedDims['symbol'];
        };

        return new Cube({
            idSpec: 'id',
            fields: [
                {name: 'symbol', isDimension: true},
                {name: 'sector', isDimension: true},
                {name: 'model', isDimension: true},
                {name: 'fund', isDimension: true},
                {name: 'region', isDimension: true},
                {name: 'trader', isDimension: true},
                {name: 'dir', displayName: 'Direction', isDimension: true},
                {name: 'quantity', type: 'number', aggregator: 'SUM', canAggregateFn: isInstrument},
                {name: 'price', type: 'number', aggregator: 'UNIQUE', canAggregateFn: isInstrument},
                {name: 'commission', type: 'number', aggregator: 'SUM'}
            ]
        });
    }

    createCubeGridModel() {
        const {cubeView} = this;
        return new GridModel({
            treeMode: true,
            treeStyle: TreeStyle.HIGHLIGHTS_AND_BORDERS,
            sortBy: 'cubeLabel',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            sizingMode: XH.appModel.gridSizingMode,
            colDefaults: {enableFilter: true},
            filterModel: {
                valueSource: cubeView,
                target: cubeView
            },
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    width: 40,
                    hidden: true
                },
                {
                    field: 'cubeLabel',
                    headerName: 'Name',
                    flex: 1,
                    minWidth: 180,
                    isTreeColumn: true
                },
                {
                    field: 'fund',
                    width: 130
                },
                {
                    field: 'trader',
                    width: 130
                },
                {
                    field: 'quantity',
                    headerName: 'Qty',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true
                    }),
                    enableEnumFilter: false,
                    hidden: true
                },
                {
                    field: 'price',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 4
                    }),
                    enableEnumFilter: false,
                    hidden: true
                },
                {
                    field: 'commission',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true
                    }),
                    enableEnumFilter: false
                }
            ]
        });
    }

    createCubeView() {
        return this.cube.createView({
            query: this.cubeQuery,
            connect: true
        });
    }

    createCubeFilterChooserModel() {
        const {cubeView} = this;
        return new FilterChooserModel({
            valueSource: cubeView,
            target: cubeView
        });
    }

    createGroupingChooserModel() {
        const presets = XH.getConf('cubeTestDefaultDims');
        return new GroupingChooserModel({
            persistWith: {localStorageKey: 'columnFilterTestGroupingChooser'},
            dimensions: this.cube.dimensions,
            initialValue: presets[0],
            initialFavorites: presets
        });
    }
}
