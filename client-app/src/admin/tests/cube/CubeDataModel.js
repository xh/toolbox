import {emptyFlexCol, GridModel} from '@xh/hoist/cmp/grid';
import {timeCol} from '@xh/hoist/cmp/grid/columns';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {Cube} from '@xh/hoist/data/cube';
import {fmtThousands, fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {bindable, comparer} from '@xh/hoist/mobx';
import {start} from '@xh/hoist/promise';
import {castArray, isEmpty} from 'lodash';
import {DimensionManagerModel} from './dimensions/DimensionManagerModel';

@HoistModel
@LoadSupport
export class CubeDataModel {

    @managed cube;
    @managed gridModel;
    @managed loadTimesGridModel;
    @managed dimManagerModel;

    @bindable includeLeaves = false;
    @bindable includeRoot = false;
    @bindable orderCount = XH.getPref('cubeTestOrderCount');
    @bindable fundFilter = null;

    // Flag to short-circuit initial/duplicate firing of query reaction (below).
    _initialLoadComplete = false;

    constructor() {
        this.gridModel = this.createGridModel();
        this.loadTimesGridModel = this.createLoadTimesGridModel();
        this.cube = this.createCube();

        const cubeDims = this.cube.fieldList
            .filter(it => it.isDimension)
            .map(it => ({value: it.name, label: it.displayName}));

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

        this.addReaction({
            track: () => this.orderCount,
            run: (count) => {
                XH.setPref('cubeTestOrderCount', count);
                this.loadAsync();
            }
        });
    }

    clearLoadTimes() {
        this.loadTimesGridModel.store.loadData([]);
    }

    getQuery() {
        const {dimManagerModel, fundFilter, includeLeaves, includeRoot} = this,
            filterFn = (val) => {return val > 10000000},
            dimensions = dimManagerModel.value,
            // TODO: values cannot be undefined, fix this.
            filters = !isEmpty(fundFilter) ?
                [{name: 'fund', values: [...fundFilter]}] :
                [{name: 'mktVal', values: [], filterFn: filterFn}];

        return {dimensions, filters, includeLeaves, includeRoot};
    }

    async doLoadAsync() {
        let orders,
            ocTxt = fmtThousands(this.orderCount) + 'k';

        await this.withLoadTime(`Gen ${ocTxt} orders`, async () => {
            orders = await XH.portfolioService.generateOrdersAsync(this.orderCount);
            orders.forEach(it => it.maxConfidence = it.minConfidence = it.confidence);
        });

        await this.withLoadTime('Load Cube', async () => {
            await this.cube.loadDataAsync(orders, {});
        });

        await this.executeQueryAsync();
        this._initialLoadComplete = true;
    }

    async executeQueryAsync() {
        const query = this.getQuery(),
            dimCount = query.dimensions.length,
            filterCount = !isEmpty(query.filters) ? query.filters[0].values.length : 0;

        // Query is initialized with empty dims and is triggering an initial run we don't need.
        if (!dimCount) return;

        return start(async () => {
            let data;
            await this.withLoadTime(`Query | ${dimCount} dims | ${filterCount} fund filters`, async () => {
                data = await this.cube.executeQueryAsync(this.getQuery()) ;
            });

            await this.withLoadTime('Load Grid', () => {
                this.gridModel.loadData(data) ;
            });
        }).linkTo(this.loadModel);
    }

    async withLoadTime(tag, fn) {
        const start = Date.now();
        await fn();
        const end = Date.now();

        this.addLoadTimes([{
            timestamp: end,
            took: end - start,
            tag
        }]);
    }

    createCube() {
        const isInstrument = (dim, val, appliedDims) => {
            return !!appliedDims['symbol'];
        };

        return new Cube({
            idSpec: XH.genId,
            fields: [
                {name: 'symbol', isDimension: true},
                {name: 'sector', isDimension: true},
                {name: 'model', isDimension: true},
                {name: 'fund', isDimension: true},
                {name: 'region', isDimension: true},
                {name: 'trader', isDimension: true},
                {name: 'dir', displayName: 'Direction', isDimension: true},
                {name: 'mktVal', displayName: 'Market Value', aggregator: 'SUM'},

                {name: 'quantity', aggregator: 'SUM', canAggregateFn: isInstrument},
                {name: 'price', aggregator: 'UNIQUE', canAggregateFn: isInstrument},

                {name: 'commission', aggregator: 'SUM'},
                // {name: 'confidence', aggregator: 'AVG'},  // TODO - average aggregator?

                {name: 'maxConfidence', aggregator: 'MAX'},
                {name: 'minConfidence', aggregator: 'MIN'},
                {name: 'time', aggregator: 'MAX'}
            ]
        });
    }

    createGridModel() {
        return new GridModel({
            treeMode: true,
            showSummary: true,
            store: {
                loadRootAsSummary: true
            },
            sortBy: 'time|desc',
            emptyText: 'No records found...',
            enableColChooser: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            compact: XH.appModel.useCompactGrids,
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
                    field: 'mktVal',
                    headerName: 'Mkt Value (m)',
                    headerTooltip: 'Market value (in millions USD)',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                    renderer: millionsRenderer({
                        precision: 3,
                        ledger: true
                    })
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
                    })
                },
                {
                    field: 'price',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 4
                    })
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
                    })
                },
                {
                    field: 'minConfidence',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 0
                    })
                },
                {
                    field: 'time',
                    ...timeCol
                },
                {...emptyFlexCol}
            ]
        });
    }

    createLoadTimesGridModel() {
        return new GridModel({
            store: {idSpec: 'timestamp'},
            sortBy: 'timestamp|desc',
            emptyText: 'No actions recorded...',
            columns: [
                {field: 'timestamp', hidden: true},
                {field: 'tag', flex: 1},
                {
                    field: 'took',
                    width: 80,
                    align: 'right',
                    renderer: numberRenderer({precision: 0, label: 'ms'})
                }
            ]
        });
    }

    addLoadTimes(times) {
        times = castArray(times);
        this.loadTimesGridModel.store.updateData(times);
    }
}