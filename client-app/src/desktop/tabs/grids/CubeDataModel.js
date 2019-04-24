import {XH, HoistModel, managed} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {random, sample, times} from 'lodash';
import {start} from '@xh/hoist/promise';
import {bindable, observable, action} from '@xh/hoist/mobx'
import {View} from '@xh/hoist/data/cube';

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
export class CubeDataModel {


    @managed
    gridModel = this.createGridModel();

    @managed
    cubeModel = new CubeModel();

    cubeView = new View({
        cube: this.cubeModel.cube,
        query: {},
        connect: true
    });

    @observable.ref runTimes = {};

    constructor() {
        const store = this.gridModel.store;
        this.cubeView.setBoundStore(store);
    }

    @action
    setRunTimes(v) {this.runTimes = v}

    loadCube() {
        this.cubeModel.reloadCube();
    }


    createGridModel() {
        return new GridModel({
            selModel: {mode: 'multiple'},
            sortBy: 'day|desc|abs',
            emptyText: 'No records found...',
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    width: 140,
                },
                {
                    field: 'symbol',
                    width: 200
                },
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


}

import {Cube} from '@xh/hoist/data/cube';

class CubeModel {

    @bindable recordCount = 25000;
    @bindable idSeed = 1;

    cube = new Cube({
        data: this.genTestData(),
        fields: [{name: 'id'}, {name: 'symbol;'}, {name: 'volume'}],
    });


    reloadCube() {
        this.cube.loadData(this.genTestData());
    }


    //----------------
    // IMPLEMENTATION
    //----------------

    genTestData() {
        let count = 0;
        const idSeed = this.idSeed;
        let ret = [];
        while (count < this.recordCount) {
            let symbol = 'Symbol ' + count;

            count++;
            const pos = {
                id: `${idSeed}~${symbol}`,
                symbol,
                volume: random(1000, 2000000)
            };
            ret.push(pos);
            // if (this.tree) {
            //     const childCount = random(0, 10);
            //     pos.children = times(childCount, (t) => {
            //         trader = 'trader' + t;
            //         count++;
            //         const child = {
            //             id: `${idSeed}~${symbol}~${trader}`,
            //             trader,
            //             symbol,
            //             day: random(-80000, 100000),
            //             mtd: random(-500000, 500000),
            //             ytd: random(-1000000, 2000000),
            //             volume: random(1000, 1200000)
            //         };
            //         this._allData.push(child);
            //         return child;
            //     });
            // }

        }
        console.log(`Generated ${count} test records.`);
        return ret;
    }

}