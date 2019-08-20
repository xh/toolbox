import {HoistModel, managed, XH} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {millionsRenderer, numberRenderer, fmtMillions, fmtNumber} from '@xh/hoist/format';
import {emptyFlexCol, GridModel} from '@xh/hoist/cmp/grid';
import {random, sample, times} from 'lodash';
import {start} from '@xh/hoist/promise';
import {action, bindable, observable} from '@xh/hoist/mobx';

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
    @bindable recordCount = 750;
    // Loop x times over nodes, randomly selecting a note and twiddling data.
    @bindable twiddleCount = Math.round(this.recordCount * .10);
    // Prefix for all IDs - change to ensure no IDs re-used across data gens.
    @bindable idSeed = 1;
    // True to generate data in tree structure.
    @bindable tree = false;
    @bindable useTransactions = true;
    @bindable useDeltaSort = true;

    // Generated data in tree
    _data;

    @managed
    @observable
    gridModel = this.createGridModel();

    @bindable gridUpdateTime = null;
    @bindable gridLoadTime = null;

    constructor() {
        this.addReaction({
            track: () =>  [this.tree, this.useTransactions, this.useDeltaSort],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.clearData();
                this.loadAsync();
            },
            delay: 100
        });

        this.addReaction({
            track: () =>  this.recordCount,
            run: () => this.clearData()
        });
    }

    clearData() {
        this._data = null;
    }

    async doLoadAsync(loadSpec) {
        if (loadSpec.isAutoRefresh) return; // avoid auto-refresh confusing our tests here

        if (!this._data) {
            this.genTestData();
        }
        this.loadData(this._data);
    }

    clearGrid() {
        this.loadData([]);
    }


    loadData(data) {
        const loadStart = Date.now();
        return start(() => {
            this.gridModel.loadData(data);
        }).linkTo(
            this.loadModel
        ).finally(() => {
            this.setGridLoadTime(Date.now() - loadStart);
            this.setGridUpdateTime(null);

        });
    }

    updateData(updates) {
        const loadStart = Date.now();
        return start(() => {
            this.gridModel.store.updateData(updates);
        }).finally(() => {
            this.setGridUpdateTime(Date.now() - loadStart);
        });
    }


    genTestData() {
        this._data = [];
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
                    return child;
                });
            }

            this._data.push(pos);
        }

        console.log(`Generated ${count} test records.`);
    }

    twiddleData() {
        if (!this._data) {
            console.log('No data to twiddle');
            return;
        }

        const newPositions = [];
        times(this.twiddleCount, () => {
            const pos = sample(this.gridModel.store.allRecords);
            newPositions.push({
                ...pos,
                day: random(-80000, 100000),
                volume: random(1000, 1200000)
            });
        });

        this.updateData({updates: newPositions});
    }

    createGridModel() {
        return new GridModel({
            selModel: {mode: 'multiple'},
            sortBy: 'id',
            emptyText: 'No records found...',
            treeMode: this.tree,
            experimental: {
                useTransactions: this.useTransactions,
                useDeltaSort: this.useDeltaSort,
                suppressUpdateExpandStateOnDataLoad: true
            },
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    width: 140,
                    isTreeColumn: this.tree
                },
                {
                    field: 'symbol',
                    agOptions: {
                        filter: 'agTextColumnFilter',
                        suppressMenu: false
                    },
                    width: 200
                },
                {
                    field: 'trader',
                    width: 200
                },
                {
                    field: 'day',
                    ...pnlColumn,
                    agOptions: {enableCellChangeFlash: true}
                },
                {field: 'mtd', headerName: 'MTD', ...pnlColumn},
                {field: 'ytd', headerName: 'YTD', ...pnlColumn},
                {
                    headerName: 'Volume',
                    field: 'volume',
                    align: 'right',
                    width: 130,
                    agOptions: {enableCellChangeFlash: true},
                    renderer: millionsRenderer({
                        precision: 2,
                        label: true,
                        tooltip: true
                    })
                },
                {
                    headerName: 'Complex',
                    field: 'complex',
                    align: 'right',
                    width: 130,
                    renderer: (v, {record}) => {
                        return fmtMillions(record.volume, {precision: 2, label: true}) +
                            ' | ' +
                            fmtNumber(record.day, {colorSpec: true});
                    },
                    rendererIsComplex: true
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