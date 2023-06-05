import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {Cube} from '@xh/hoist/data';
import {fmtThousands} from '@xh/hoist/format';
import {times} from 'lodash';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {Timer} from '@xh/hoist/utils/async';
import {PctTotalAggregator} from './PctTotalAggregator';
import {CubeTestModel} from './CubeTestModel';

export class CubeModel extends HoistModel {
    @managed cube: Cube;
    @managed orders: PlainObject[] = [];
    @managed timer: Timer;

    parent: CubeTestModel;

    constructor(parent) {
        super();
        this.cube = this.createCube();
        this.parent = parent;

        this.timer = Timer.create({
            runFn: () => this.streamChangesAsync(),
            interval: () => parent.updateFreq ?? -1,
            intervalUnits: SECONDS
        });
    }

    override async doLoadAsync(loadSpec) {
        const LTM = this.parent.loadTimesModel;
        let orders = [];
        await LTM.withLoadTime('Fetch orders', async () => {
            orders = await XH.portfolioService.getAllOrdersAsync({loadSpec});
            orders.forEach(it => {
                it.pctCommission = it.commission;
                it.maxConfidence = it.minConfidence = it.confidence;
            });
        });

        const ocTxt = fmtThousands(orders.length) + 'k';
        await LTM.withLoadTime(`Loaded ${ocTxt} orders in Cube`, async () => {
            await this.cube.loadDataAsync(orders, {asOf: Date.now()});
        });

        this.orders = orders;
    }

    private createCube() {
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
                {name: 'pctCommission', aggregator: new PctTotalAggregator()},

                {name: 'maxConfidence', aggregator: 'MAX'},
                {name: 'minConfidence', aggregator: 'MIN'},
                {name: 'time', aggregator: 'MAX'}
            ]
        });
    }

    private async streamChangesAsync() {
        const {orders} = this;
        if (!orders.length) return;
        const {updateCount, loadTimesModel: LTM} = this.parent;
        const updates = times(updateCount, () => {
            const random = Math.floor(Math.random() * orders.length),
                order = orders[random];

            const newCom = order.commission * (1 + (0.5 - Math.random()) * 0.5);

            order.commission = newCom;
            order.pctCommission = newCom;

            return order;
        });

        await LTM.withLoadTime(`Updated ${updateCount} orders in Cube`, async () => {
            await this.cube.updateDataAsync(updates, {asOf: Date.now()});
        });
    }
}
