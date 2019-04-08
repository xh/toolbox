import {XH, HoistModel, managed} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {random, times} from 'lodash';
import {start} from '@xh/hoist/promise';
import {bindable, observable, action} from '@xh/hoist/mobx';

const pnlColumn = {
    absSort: true,
    align: 'right',
    width: 120,
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true,
        tooltip: true
    })
};

@HoistModel
@LoadSupport
export class GridTestModel {

    @bindable recordCount = 10000;
    @bindable tree = false;
    @bindable clearData = false;

    @managed
    @observable
    gridModel = this.createGridModel();

    @observable.ref runTimes = {};

    constructor() {
        this.addReaction({
            track: () =>  this.tree,
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.loadAsync();
            }
        });
    }

    doLoadAsync() {
        const runTimes = {};

        return start(() => {
            if (this.clearData) {
                const clearStart = Date.now();
                this.gridModel.loadData([]);
                runTimes.clear = Date.now() - clearStart;
            }
        }).then(() => {
            const dataStart = Date.now();
            const data = this.genTestData();
            runTimes.data = Date.now() - dataStart;
            return data;
        }).then(data => {
            const loadStart = Date.now();
            this.gridModel.loadData(data);
            runTimes.load = Date.now() - loadStart;
        }).linkTo(
            this.loadModel
        ).finally(() => {
            this.setRunTimes(runTimes);
        });
    }

    @action
    setRunTimes(v) {this.runTimes = v}

    genTestData() {
        return times(this.recordCount, (i) => {
            let symbol = 'Symbol ' + i,
                trader = 'Trader ' + i % (this.recordCount/10);

            const pos = {
                id: symbol,
                trader,
                symbol,
                day: random(-80000, 100000, true),
                mtd: random(-500000, 500000, true),
                ytd: random(-1000000, 2000000, true),
                volume: random(1000, 2000000, true)
            };

            if (this.tree) {
                const childCount = random(0, 10);
                pos.children = times(childCount, (t) => {
                    trader = 'trader' + t;
                    return {
                        id: symbol+trader,
                        trader,
                        symbol,
                        day: random(-80000, 100000, true),
                        mtd: random(-500000, 500000, true),
                        ytd: random(-1000000, 2000000, true),
                        volume: random(1000, 1200000, true)
                    };
                });
            }

            return pos;
        });
    }

    createGridModel() {
        return new GridModel({
            selModel: {mode: 'multiple'},
            sortBy: 'day|desc|abs',
            // groupBy: 'trader',
            emptyText: 'No records found...',
            treeMode: this.tree,
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    width: 140,
                    isTreeColumn: this.tree
                },
                {
                    field: 'symbol',
                    width: 200
                },
                {
                    field: 'trader',
                    width: 200
                },
                {field: 'day', ...pnlColumn},
                {field: 'mtd', headerName: 'MTD', ...pnlColumn},
                {field: 'ytd', headerName: 'YTD', ...pnlColumn},
                {
                    headerName: 'Volume',
                    field: 'volume',
                    align: 'right',
                    width: 130,
                    renderer: millionsRenderer({
                        precision: 2,
                        label: true,
                        tooltip: true
                    })
                },
                {...emptyFlexCol}
            ]
        });
    }

    @action
    tearDown() {
        XH.destroy(this.gridModel);
        this.gridModel = this.createGridModel();
        this.runTimes = {};
    }
}