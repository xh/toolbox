import {XH, HoistModel, managed} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {random, sample, times} from 'lodash';
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

    // Total count (approx) of all nodes generated (parents + children).
    @bindable recordCount = 75000;
    // Loop x times over nodes, randomly selecting a note and twiddling data.
    @bindable twiddleCount = 10000;
    // Prefix for all IDs - change to ensure no IDs re-used across data gens.
    @bindable idSeed = 1;
    // True to generate data in tree structure.
    @bindable tree = false;

    // Generated data in tree (if requested).
    _data;
    // Generated data in flat list (for twiddling).
    _allData;

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
                this.clearData();
                this.loadAsync();
            }
        });

        this.addReaction({
            track: () =>  this.recordCount,
            run: () => this.clearData()
        });
    }

    clearData() {
        this._data = null;
        this._allData = null;
    }

    async doLoadAsync(loadSpec) {
        if (loadSpec.isAutoRefresh) return; // avoid auto-refresh confusing our tests here

        const runTimes = {};
        return start(() => {
            if (!this._data) {
                const dataStart = Date.now();
                this.genTestData();
                runTimes.data = Date.now() - dataStart;
            }

            const loadStart = Date.now();
            this.gridModel.loadData(this._data);
            runTimes.load = Date.now() - loadStart;
        }).linkTo(
            this.loadModel
        ).finally(() => {
            this.setRunTimes(runTimes);
        });
    }

    clearGrid() {
        start(() => {
            const start = Date.now();
            this.gridModel.loadData([]);
            this.setRunTimes({load: Date.now() - start});
        }).linkTo(this.loadModel);
    }

    @action
    setRunTimes(v) {this.runTimes = v}

    genTestData() {
        this._data = [];
        this._allData = [];
        let count = 0;
        const idSeed = this.idSeed;

        while (count < this.recordCount) {
            let symbol = 'Symbol ' + count,
                trader = 'Trader ' + count % (this.recordCount/10);

            count++;
            const pos = {
                id: `${idSeed}~${symbol}`,
                trader,
                symbol,
                day: random(-80000, 100000),
                mtd: random(-500000, 500000),
                ytd: random(-1000000, 2000000),
                volume: random(1000, 2000000)
            };

            if (this.tree) {
                const childCount = random(0, 10);
                pos.children = times(childCount, (t) => {
                    trader = 'trader' + t;
                    count++;
                    const child = {
                        id: `${idSeed}~${symbol}~${trader}`,
                        trader,
                        symbol,
                        day: random(-80000, 100000),
                        mtd: random(-500000, 500000),
                        ytd: random(-1000000, 2000000),
                        volume: random(1000, 1200000)
                    };
                    this._allData.push(child);
                    return child;
                });
            }

            this._data.push(pos);
            this._allData.push(pos);
        }

        console.log(`Generated ${count} test records.`);
    }

    twiddleData() {
        if (!this._allData) {
            console.log('No data to twiddle');
            return;
        }

        times(this.twiddleCount, () => {
            const pos = sample(this._allData);
            pos.day = random(-80000, 100000);
            pos.volume = random(1000, 1200000);
        });
    }

    createGridModel() {
        return new GridModel({
            selModel: {mode: 'multiple'},
            sortBy: 'day|desc|abs',
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
        this._data = null;
        this.runTimes = {};
    }
}