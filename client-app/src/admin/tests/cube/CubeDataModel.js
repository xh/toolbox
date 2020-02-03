import {emptyFlexCol, GridModel} from '@xh/hoist/cmp/grid';
import {timeCol} from '@xh/hoist/cmp/grid/columns';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {Cube} from '@xh/hoist/data/cube';
import {fmtThousands, numberRenderer} from '@xh/hoist/format';
import {bindable, comparer} from '@xh/hoist/mobx';
import {start} from '@xh/hoist/promise';
import {isEmpty, times} from 'lodash';
import {DimensionManagerModel} from './dimensions/DimensionManagerModel';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {Timer} from '@xh/hoist/utils/async';
import {LoadTimesModel} from './LoadTimesModel';

@HoistModel
@LoadSupport
export class CubeDataModel {

    @managed cube;
    @managed gridModel;
    @managed dimManagerModel;
    @managed orders = [];
    @managed loadTimesModel;

    @bindable includeLeaves = false;
    @bindable fundFilter = null;
    @bindable showSummary = false;

    // Flag to short-circuit initial/duplicate firing of query reaction (below).
    _initialLoadComplete = false;

    constructor() {
        this.gridModel = this.createGridModel();
        this.cube = this.createCube();
        this.loadTimesModel = new LoadTimesModel();

        const cubeDims = this.cube.store.fields
            .filter(it => it.isDimension)
            .map(it => ({value: it.name, label: it.label}));

        this.dimManagerModel = new DimensionManagerModel({
            dimensions: cubeDims,
            defaultDimConfig: 'cubeTestDefaultDims',
            userDimPref: 'cubeTestUserDims'
        });

        this.addReaction({
            track: () => this.getQuery(),
            run: () => {
                if (this._initialLoadComplete) {
                    this.executeQueryAsync();
                }
            },
            equals: comparer.structural
        });

        Timer.create({
            runFn: () => this.streamChanges(),
            interval: 10 * SECONDS
        });
    }

    getQuery() {
        const {dimManagerModel, fundFilter, includeLeaves} = this,
            dimensions = dimManagerModel.value,
            filters = !isEmpty(fundFilter) ? [{name: 'fund', values: [...fundFilter]}] : null,
            includeRoot = this.showSummary;

        return {dimensions, filters, includeLeaves, includeRoot};
    }

    async doLoadAsync() {
        const LTM = this.loadTimesModel;
        let orders = [];
        await LTM.withLoadTime('Fetch orders', async () => {
            orders = await XH.portfolioService.getAllOrdersAsync();
            orders.forEach(it => it.maxConfidence = it.minConfidence = it.confidence);
        });

        const ocTxt = fmtThousands(orders.length) + 'k';
        await LTM.withLoadTime(`Loaded ${ocTxt} orders in Cube`, async () => {
            await this.cube.loadData(orders, {});
        });

        await this.executeQueryAsync();
        this.orders = orders;
        this._initialLoadComplete = true;
    }

    async executeQueryAsync() {
        const LTM = this.loadTimesModel,
            {gridModel, loadModel, cube, showSummary} = this,
            query = this.getQuery(),
            dimCount = query.dimensions.length,
            filterCount = !isEmpty(query.filters) ? query.filters[0].values.length : 0;

        // Query is initialized with empty dims and is triggering an initial run we don't need.
        if (!dimCount) return;

        return start(async () => {
            let data;
            await LTM.withLoadTime(`Query | ${dimCount} dims | ${filterCount} fund filters`, async () => {
                data = await cube.executeQuery(query) ;
            });

            gridModel.setShowSummary(showSummary);
            gridModel.store.setLoadRootAsSummary(showSummary);

            await LTM.withLoadTime('Load Grid', () => {
                gridModel.loadData(data) ;
            });
        }).linkTo(loadModel);
    }

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
               
                {name: 'quantity', aggregator: 'SUM', canAggregateFn: isInstrument},
                {name: 'price', aggregator: 'UNIQUE', canAggregateFn: isInstrument},

                {name: 'commission', aggregator: 'SUM'},

                {name: 'maxConfidence', aggregator: 'MAX'},
                {name: 'minConfidence', aggregator: 'MIN'},
                {name: 'time', aggregator: 'MAX'}
            ]
        });
    }

    createGridModel() {
        return new GridModel({
            treeMode: true,
            showSummary: this.showSummary,
            store: {
                loadRootAsSummary: this.showSummary
            },
            sortBy: 'time|desc',
            emptyText: 'No records found...',
            enableColChooser: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            sizingMode: XH.appModel.gridSizingMode,
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
                    field: 'quantity',
                    headerName: 'Qty',
                    align: 'right',
                    width: 130,
                    absSort: true,
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
                    renderer: numberRenderer({
                        precision: 4
                    }),
                    hidden: true
                },
                {
                    field: 'commission',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true
                    })
                },
                {
                    field: 'maxConfidence',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 0
                    }),
                    hidden: true
                },
                {
                    field: 'minConfidence',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 0
                    }),
                    hidden: true
                },
                {
                    field: 'time',
                    ...timeCol
                },
                {...emptyFlexCol}
            ]
        });
    }

    streamChanges() {
        if (!this.orders.length) return;
        const updates = times(100, () => {
            const random = Math.floor(Math.random() * this.orders.length),
                order = this.orders[random];

            order.commission = order.commission * (1 + (0.5 - Math.random()) * 0.1);

            return order;
        });

        console.log(updates);
        this.cube.updateData(updates);
    }
}
