import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {fmtMillions, fmtNumber, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel} from '@xh/hoist/cmp/grid';
import {mean, random, sample, takeRight, times} from 'lodash';
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
    @bindable recordCount = 5000;
    // Loop x times over nodes, randomly selecting a note and twiddling data.
    @bindable twiddleCount = Math.round(this.recordCount * .10);
    // Prefix for all IDs - change to ensure no IDs re-used across data gens.
    @bindable idSeed = 1;
    // True to generate data in tree structure.
    @bindable tree = false;
    @bindable useTransactions = true;
    @bindable useDeltaSort = true;
    @bindable disableSelect = false;
    @bindable useHoistAutosize = true;
    @bindable providerType = 'transient';

    // Generated data in tree
    _data;

    @managed
    @observable.ref
    gridModel;

    @bindable gridUpdateTime = null;
    @bindable avgGridUpdateTime = null;
    _gridUpdateTimes = [];

    @bindable gridLoadTime = null;
    @bindable avgGridLoadTime = null;
    _gridLoadTimes = [];

    constructor() {
        this.gridModel = this.createGridModel();
        this.addReaction({
            track: () =>  [
                this.tree,
                this.useTransactions,
                this.useDeltaSort,
                this.disableSelect,
                this.useHoistAutosize,
                this.providerType
            ],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.clearData();
                this.loadAsync();
            },
            debounce: 100
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
        this._gridLoadTimes = [];
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

            this._gridLoadTimes = takeRight([...this._gridLoadTimes, this.gridLoadTime], 10);
            this.setAvgGridLoadTime(mean(this._gridLoadTimes));

            this.setGridUpdateTime(null);
            this.setAvgGridUpdateTime(null);
            this._gridUpdateTimes = [];

        });
    }

    updateData(updates) {
        const loadStart = Date.now();
        return start(() => {
            this.gridModel.updateData(updates);
        }).finally(() => {
            this.setGridUpdateTime(Date.now() - loadStart);
            this._gridUpdateTimes = takeRight([...this._gridUpdateTimes, this.gridUpdateTime], 10);

            this.setAvgGridUpdateTime(mean(this._gridUpdateTimes));
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
                ...pos.raw,
                day: random(-80000, 100000),
                volume: random(1000, 1200000)
            });
        });

        this.updateData({update: newPositions});
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
                useHoistAutosize: this.useHoistAutosize
            },
            stateModel: {
                provider: {type: this.providerType, key: 'stateTest', subKey: 'gridState'}
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
                    highlightOnChange: true,
                    ...pnlColumn
                },
                {field: 'mtd', headerName: 'MTD', ...pnlColumn},
                {field: 'ytd', headerName: 'YTD', ...pnlColumn},
                {
                    headerName: 'Volume',
                    field: 'volume',
                    align: 'right',
                    width: 130,
                    highlightOnChange: true,
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
                        return fmtMillions(record.data.volume, {precision: 2, label: true}) +
                            ' | ' +
                            fmtNumber(record.data.day, {colorSpec: true});
                    },
                    rendererIsComplex: true
                }
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
