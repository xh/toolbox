import {emptyFlexCol, GridModel} from '@xh/hoist/cmp/grid';
import {numberCol, timeCol} from '@xh/hoist/cmp/grid/columns';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {Cube, View} from '@xh/hoist/data/cube';
import {fmtThousands, fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {bindable, comparer} from '@xh/hoist/mobx';
import {wait, start} from '@xh/hoist/promise';
import {castArray, values} from 'lodash';
import {DimensionManagerModel} from './dimensions/DimensionManagerModel';

@HoistModel
@LoadSupport
export class CubeDataModel {

    @managed cube;
    @managed cubeView;
    @managed gridModel;
    @managed loadTimesGridModel
    @managed dimManagerModel;

    @bindable includeLeaves = false;
    @bindable includeRoot = false;
    @bindable orderCount = XH.getPref('cubeTestOrderCount')
    @bindable fundFilter = null;

    constructor() {
        this.gridModel = this.createGridModel();
        this.loadTimesGridModel = this.createLoadTimesGridModel();
        this.cube = this.createCube();

        const cubeDims = values(this.cube.fields)
            .filter(it => it.isDimension)
            .map(it => ({value: it.name, label: it.displayName}));

        this.dimManagerModel = new DimensionManagerModel({
            dimensions: cubeDims,
            defaultDimConfig: 'cubeTestDefaultDims',
            userDimPref: 'cubeTestUserDims'
        });

        this.cubeView = new View({
            cube: this.cube,
            boundStore: this.gridModel.store,
            query: this.getQuery(),
            connect: true
        });

        this.addReaction({
            track: () => this.getQuery(),
            run: (q) => this.setQuery(q),
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

    getQuery() {
        const {dimManagerModel, fundFilter, includeLeaves, includeRoot} = this,
            dimensions = dimManagerModel.value,
            filters = fundFilter ? [{name: 'fund', values: fundFilter}] : null;

        return {dimensions, filters, includeLeaves, includeRoot};
    }

    setQuery(q) {
        start(() => {
            const start = Date.now();
            this.cubeView.setQuery(q);
            const end = Date.now();
            this.addLoadTimes({
                timestamp: end,
                took: end - start,
                tag: 'Set query'
            });
        }).linkTo(this.loadModel);
    }

    async doLoadAsync() {
        const loadTimes = [],
            {loadModel} = this,
            ocTxt = fmtThousands(this.orderCount) + 'k';

        let start = Date.now();
        loadModel.setMessage(`Generating ${ocTxt} orders`);
        await wait(10);  // Allow mask message to update

        const orders = XH.portfolioService.generateOrders(this.orderCount);
        orders.forEach(it => it.maxConfidence = it.minConfidence = it.confidence);

        let end = Date.now();
        loadTimes.push({
            timestamp: end,
            took: end - start - 10,
            tag: `Gen ${ocTxt} orders`
        });


        start = Date.now();
        loadModel.setMessage('Loading cube...');
        await wait(10);

        this.cube.loadData(orders, {});

        end = Date.now();
        loadTimes.push({
            timestamp: end,
            took: end - start - 10,
            tag: 'Load cube'
        });

        loadModel.setMessage('');
        this.addLoadTimes(loadTimes);
    }

    createCube() {
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
                {name: 'quantity', aggregator: 'SUM'},
                {name: 'commission', aggregator: 'SUM'},
                // {name: 'confidence', aggregator: 'AVG'},  // TODO - average aggregator?
                {name: 'maxConfidence', aggregator: 'MAX'},
                {name: 'minConfidence', aggregator: 'MIN'},
                {name: 'price', aggregator: 'UNIQUE'},
                {name: 'time', aggregator: 'MAX'}
            ]
        });
    }

    createGridModel() {
        return new GridModel({
            treeMode: true,
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
            columns: [
                {field: 'timestamp', hidden: true},
                {field: 'tag', flex: 1},
                {field: 'took', width: 80, ...numberCol}
            ]
        });
    }

    addLoadTimes(times) {
        times = castArray(times);
        this.loadTimesGridModel.store.updateData(times);
    }
}