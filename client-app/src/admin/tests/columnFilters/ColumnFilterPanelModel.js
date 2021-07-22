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

        window.cubeView = this.cubeView;
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

        // Introduce null values to test 'blank' filters
        trades.forEach(trade => {
            if (trade.city === 'Boston') trade.city = null;
        });

        gridModel.loadData(trades, summary);
        await gridModel.preSelectFirstAsync();
    }

    async loadCubeAsync(loadSpec) {
        let orders = await XH.portfolioService.getAllOrdersAsync({loadSpec});
        orders.forEach(o => {
            [1, 2, 3].forEach(v => {
                o['price' + v] = o.price;
                o['quantity' + v] = o.quantity;
            });
            [1, 2, 3, 4, 5, 6, 7].forEach(v => {
                o['commission' + v] = o.commission;
            });
        });
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
                idEncodesTreePath: true,
                freezeData: false,
                fieldDefaults: {disableXssProtection: true},
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
            colDefaults: {filterable: true},
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
                    chooserDescription: 'Daily Volume of Shares (Estimated, avg. YTD)'
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
                    chooserDescription: 'Annual Profit & Loss YTD (EBITDA)'
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
            bind: store,
            fieldSpecs: [
                'active',
                'company',
                'city',
                'trade_date',
                {field: 'profit_loss', valueRenderer: numberRenderer({precision: 0})},
                {field: 'trade_volume', valueRenderer: millionsRenderer({precision: 1, label: true})}
            ]
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
            fieldDefaults: {
                disableXssProtection: true
            },
            fields: [
                {name: 'symbol', isDimension: true},
                {name: 'sector', isDimension: true},
                {name: 'model', isDimension: true},
                {name: 'fund', isDimension: true},
                {name: 'region', isDimension: true},
                {name: 'trader', isDimension: true},
                {name: 'dir', displayName: 'Direction', isDimension: true},
                {name: 'quantity', type: 'number', aggregator: 'SUM', canAggregateFn: isInstrument},
                {name: 'quantity1', type: 'number', aggregator: 'SUM', canAggregateFn: isInstrument},
                {name: 'quantity2', type: 'number', aggregator: 'SUM', canAggregateFn: isInstrument},
                {name: 'quantity3', type: 'number', aggregator: 'SUM', canAggregateFn: isInstrument},
                {name: 'price', type: 'number', aggregator: 'UNIQUE', canAggregateFn: isInstrument},
                {name: 'price1', type: 'number', aggregator: 'UNIQUE', canAggregateFn: isInstrument},
                {name: 'price2', type: 'number', aggregator: 'UNIQUE', canAggregateFn: isInstrument},
                {name: 'price3', type: 'number', aggregator: 'UNIQUE', canAggregateFn: isInstrument},
                {name: 'commission', type: 'number', aggregator: 'SUM'},
                {name: 'commission1', type: 'number', aggregator: 'SUM'},
                {name: 'commission2', type: 'number', aggregator: 'SUM'},
                {name: 'commission3', type: 'number', aggregator: 'SUM'},
                {name: 'commission4', type: 'number', aggregator: 'SUM'},
                {name: 'commission5', type: 'number', aggregator: 'SUM'},
                {name: 'commission6', type: 'number', aggregator: 'SUM'},
                {name: 'commission7', type: 'number', aggregator: 'SUM'}
            ]
        });
    }

    createCubeGridModel() {
        const {cubeView} = this;
        return new GridModel({
            treeMode: true,
            store: {
                freezeData: true,
                idEncodesTreePath: true,
                fieldDefaults: {
                    disableXssProtection: true
                }
            },
            treeStyle: TreeStyle.HIGHLIGHTS_AND_BORDERS,
            sortBy: 'cubeLabel',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            sizingMode: XH.appModel.gridSizingMode,
            colDefaults: {filterable: true},
            filterModel: {bind: cubeView},
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
                    isTreeColumn: true,
                    filterable: false
                },
                {
                    field: 'fund',
                    width: 130
                },
                {
                    field: 'trader',
                    width: 130
                },
                {field: 'commission', ...commissionCol},
                {field: 'commission1', ...commissionCol},
                {field: 'commission2', ...commissionCol},
                {field: 'commission3', ...commissionCol},
                {field: 'commission4', ...commissionCol},
                {field: 'commission5', ...commissionCol},
                {field: 'commission6', ...commissionCol},
                {field: 'commission7', ...commissionCol},
                {field: 'quantity', ...quantityCol},
                {field: 'quantity1', ...quantityCol},
                {field: 'quantity2', ...quantityCol},
                {field: 'quantity3', ...quantityCol},
                {field: 'price', ...priceCol},
                {field: 'price1', ...priceCol},
                {field: 'price2', ...priceCol},
                {field: 'price3', ...priceCol}
            ]
        });
    }

    createCubeView() {
        return this.cube.createView({
            query: this.cubeQuery,
            loadModel: this.loadModel,
            connect: true
        });
    }

    createCubeFilterChooserModel() {
        const {cubeView} = this;
        return new FilterChooserModel({
            bind: cubeView,
            fieldSpecs: [
                'fund',
                'trader',
                {field: 'commission', valueRenderer: numberRenderer({precision: 0})},
                {field: 'commission1', valueRenderer: numberRenderer({precision: 0})},
                {field: 'commission2', valueRenderer: numberRenderer({precision: 0})},
                {field: 'commission3', valueRenderer: numberRenderer({precision: 0})},
                {field: 'commission4', valueRenderer: numberRenderer({precision: 0})},
                {field: 'commission5', valueRenderer: numberRenderer({precision: 0})},
                {field: 'commission6', valueRenderer: numberRenderer({precision: 0})},
                {field: 'commission7', valueRenderer: numberRenderer({precision: 0})},
                {field: 'quantity', valueRenderer: numberRenderer({precision: 0})},
                {field: 'quantity1', valueRenderer: numberRenderer({precision: 0})},
                {field: 'quantity2', valueRenderer: numberRenderer({precision: 0})},
                {field: 'quantity3', valueRenderer: numberRenderer({precision: 0})},
                {field: 'price', valueRenderer: numberRenderer({precision: 4})},
                {field: 'price1', valueRenderer: numberRenderer({precision: 4})},
                {field: 'price2', valueRenderer: numberRenderer({precision: 4})},
                {field: 'price3', valueRenderer: numberRenderer({precision: 4})}
            ]
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

const quantityCol = {
    headerName: 'Qty',
    align: 'right',
    width: 130,
    absSort: true,
    renderer: numberRenderer({
        precision: 0,
        ledger: true
    })
};

const priceCol = {
    align: 'right',
    width: 130,
    renderer: numberRenderer({
        precision: 4
    })
};

const commissionCol = {
    align: 'right',
    width: 130,
    renderer: numberRenderer({
        precision: 0,
        ledger: true
    })
};
