import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {Cube} from '@xh/hoist/data';
import {fmtThousands} from '@xh/hoist/format';
import {makeObservable, observable} from '@xh/hoist/mobx';
import {times} from 'lodash';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {PctTotalAggregator} from './PctTotalAggregator';
import {CubeTestModel} from './CubeTestModel';

export class CubeModel extends HoistModel {
    @managed @observable.ref cube: Cube;
    @managed orders: PlainObject[] = [];

    parent: CubeTestModel;

    // Plain setInterval rather than Timer - sub-second rates fall below Timer's 500ms floor.
    private updateIntervalId = null;
    private streamInFlight = false;

    constructor(parent) {
        super();
        makeObservable(this);
        this.parent = parent;
        this.cube = this.createCube();

        this.addReaction({
            track: () => parent.updateFreq,
            run: freq => this.restartUpdateStream(freq)
        });
    }

    private restartUpdateStream(freq: number) {
        clearInterval(this.updateIntervalId);
        this.updateIntervalId =
            freq > 0 ? setInterval(() => this.streamChangesAsync(), freq * SECONDS) : null;
    }

    override destroy() {
        clearInterval(this.updateIntervalId);
        super.destroy();
    }

    override async doLoadAsync(loadSpec) {
        const LTM = this.parent.loadTimesModel,
            {recordMultiplier} = this.parent;
        let orders = [];

        // Timed as one action, with the fetch as its own leg. Tag resolved once the count is known.
        await LTM.withLoadTime(
            () => `Loaded ${fmtThousands(orders.length)}k orders in Cube`,
            async () => {
                await LTM.withFetchTime('Fetch orders', async () => {
                    orders = await XH.portfolioService.getAllOrdersAsync({loadSpec});
                    orders.forEach(it => {
                        it.pctCommission = it.commission;
                        it.maxConfidence = it.minConfidence = it.confidence;
                        // Reuse digest - order times are stable within a server-side portfolio
                        it.rev = it.time;
                    });
                });

                // Replicate to stress-test at scale - same dimension values, fresh unique ids.
                if (recordMultiplier > 1) {
                    const base = orders;
                    orders = [...base];
                    for (let k = 1; k < recordMultiplier; k++) {
                        base.forEach(o => orders.push({...o, id: `${o.id}~r${k}`}));
                    }
                }

                await this.cube.loadDataAsync(orders, {asOf: Date.now()});
            }
        );

        this.orders = orders;
    }

    private createCube() {
        const isInstrument = (dim, val, appliedDims) => {
            return !!appliedDims['symbol'];
        };

        return new Cube({
            xhName: 'cubeTest.cube',
            idSpec: 'id',
            // Store is named 'cubeTest.cube.store' by the Cube.
            store: {
                digestSpec: 'rev',
                experimental: {maxPatchRatio: this.parent.maxPatchRatio}
            },
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

    // Skip ticks that arrive while a prior update is still applying, as Timer would have done.
    private async streamChangesAsync() {
        const {orders} = this;
        if (!orders.length || this.streamInFlight) return;
        const {updateCount, loadTimesModel: LTM} = this.parent;
        const updates = times(updateCount, () => {
            const random = Math.floor(Math.random() * orders.length),
                order = orders[random];

            const newCom = order.commission * (1 + (0.5 - Math.random()) * 0.5);

            order.commission = newCom;
            order.pctCommission = newCom;
            order.rev++;

            return order;
        });

        this.streamInFlight = true;
        try {
            await LTM.withLoadTime(`Updated ${updateCount} orders in Cube`, async () => {
                await this.cube.updateDataAsync(updates, {asOf: Date.now()});
            });
        } finally {
            this.streamInFlight = false;
        }
    }
}
