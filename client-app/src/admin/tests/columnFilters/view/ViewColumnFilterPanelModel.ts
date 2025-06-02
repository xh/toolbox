import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {ColumnSpec, GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {CompoundFilter, Cube, FieldFilter, View} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {comparer, makeObservable, observable} from '@xh/hoist/mobx';

export class ViewColumnFilterPanelModel extends HoistModel {
    @observable.ref filterJson: string = JSON.stringify(null);

    @managed cube: Cube;
    @managed view: View;
    @managed gridModel: GridModel;
    @managed filterChooserModel: FilterChooserModel;
    @managed groupingChooserModel: GroupingChooserModel;

    private get query() {
        const dimensions = this.groupingChooserModel?.value;
        return {dimensions, filter: this.view?.filter, includeLeaves: true};
    }

    constructor() {
        super();
        makeObservable(this);

        // Setup Cube mode
        this.cube = this.createCube();
        this.view = this.createView();
        this.gridModel = this.createGridModel();
        this.filterChooserModel = this.createFilterChooserModel();
        this.groupingChooserModel = this.createGroupingChooserModel();

        this.view.setStores(this.gridModel.store);

        // Update filter JSON
        this.addReaction({
            track: () => this.query.filter as FieldFilter | CompoundFilter,
            run: filter => {
                this.filterJson = JSON.stringify(filter?.toJSON() ?? null, undefined, 2);
            }
        });

        // Update cube view when query changes
        this.addReaction({
            track: () => this.query,
            run: query => {
                this.view.updateQuery(query);
            },
            fireImmediately: true,
            equals: comparer.structural
        });
    }

    override async doLoadAsync(loadSpec) {
        const orders = await XH.portfolioService.getAllOrdersAsync({loadSpec});
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

    private createCube() {
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
                {
                    name: 'quantity1',
                    type: 'number',
                    aggregator: 'SUM',
                    canAggregateFn: isInstrument
                },
                {
                    name: 'quantity2',
                    type: 'number',
                    aggregator: 'SUM',
                    canAggregateFn: isInstrument
                },
                {
                    name: 'quantity3',
                    type: 'number',
                    aggregator: 'SUM',
                    canAggregateFn: isInstrument
                },
                {name: 'price', type: 'number', aggregator: 'UNIQUE', canAggregateFn: isInstrument},
                {
                    name: 'price1',
                    type: 'number',
                    aggregator: 'UNIQUE',
                    canAggregateFn: isInstrument
                },
                {
                    name: 'price2',
                    type: 'number',
                    aggregator: 'UNIQUE',
                    canAggregateFn: isInstrument
                },
                {
                    name: 'price3',
                    type: 'number',
                    aggregator: 'UNIQUE',
                    canAggregateFn: isInstrument
                },
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

    private createGridModel() {
        const {view} = this;

        // Done
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
            colDefaults: {filterable: true},
            filterModel: {bind: view},
            levelLabels: () => {
                const labels = this.groupingChooserModel.getValueDisplayNames();
                return [...labels, 'Orders'];
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

    private createView() {
        return this.cube.createView({
            query: this.query,
            connect: true
        });
    }

    private createFilterChooserModel() {
        const {view} = this;
        return new FilterChooserModel({
            bind: view,
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

    private createGroupingChooserModel() {
        const presets = XH.getConf('cubeTestDefaultDims');
        return new GroupingChooserModel({
            persistWith: {localStorageKey: 'columnFilterTestGroupingChooser'},
            dimensions: this.cube.dimensions,
            initialValue: presets[0],
            initialFavorites: presets
        });
    }
}

const quantityCol: ColumnSpec = {
    headerName: 'Qty',
    align: 'right',
    width: 130,
    absSort: true,
    renderer: numberRenderer({
        precision: 0,
        ledger: true
    })
};

const priceCol: ColumnSpec = {
    align: 'right',
    width: 130,
    renderer: numberRenderer({
        precision: 4
    })
};

const commissionCol: ColumnSpec = {
    align: 'right',
    width: 130,
    renderer: numberRenderer({
        precision: 0,
        ledger: true
    })
};
