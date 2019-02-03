import {XH, HoistModel, managed} from '@xh/hoist/core';

import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {LocalStore} from '@xh/hoist/data';
import {GridModel, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {times} from 'lodash';
import {start} from '@xh/hoist/promise';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {bindable} from '@xh/hoist/mobx';

const pnlColumn = {
    absSort: true,
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true,
        tooltip: true
    })
};

@HoistModel
export class GridTestModel {

    @bindable recordCount = 10000;
    @bindable tree = false;

    @managed
    loadModel = new PendingTaskModel();

    @managed
    gridModel = this.createGridModel();

    constructor() {
        this.addReaction({
            track: () =>  this.tree,
            run: () => {
                console.log('swapping out grid');
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
            }
        });
    }

    loadAsync() {
        return start(() => {
            return this.genTestData();
        }).then(data => {
            console.log('hi');
            console.time('sniff');
            this.gridModel.loadData(data);
            console.timeEnd('sniff');
        }).linkTo(
            this.loadModel
        );
    }

    genTestData() {
        const ret = times(this.recordCount, (i) => {
            let symbol = 'symbol' + i,
                trader = null;
            const pos = {
                id: symbol,
                trader,
                symbol,
                day: Math.random() * 100,
                mtd: Math.random() * 100,
                ytd: Math.random() * 100,
                volume: 100000
            };
            if (this.tree) {
                pos.children = times(2, (t) => {
                    trader = 'trader' + t;
                    return {
                        id: symbol+trader,
                        trader,
                        symbol,
                        day: Math.random() * 100,
                        mtd: Math.random() * 100,
                        ytd: Math.random() * 100,
                        volume: 100000
                    };
                });
            }
            return pos;
        });
        return ret;
    }

    createGridModel() {
        return new GridModel({
            store: new LocalStore({
                fields: ['id', 'symbol', 'trader', 'day', 'mtd', 'ytd']
            }),
            selModel: {mode: 'multiple'},
            sortBy: 'day|desc|abs',
            emptyText: 'No records found...',
            treeMode: this.tree,
            columns: [
                {
                    field: 'id',
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
                {field: 'mtd', ...pnlColumn},
                {field: 'ytd', ...pnlColumn},
                {
                    headerName: 'quantity',
                    field: 'volume',
                    align: 'right',
                    width: 130,
                    renderer: millionsRenderer({
                        precision: 1,
                        label: true,
                        tooltip: true
                    })
                },
                {...emptyFlexCol}
            ]
        });
    }
}