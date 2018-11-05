import {HoistModel} from '@xh/hoist/core';
import {PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';

import {PositionsPanelModel} from './PositionsPanelModel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {LineChartModel} from './LineChartModel';
import {OHLCChartModel} from './OHLCChartModel';

@HoistModel
export class PortfolioPanelModel {

    positionsPanelModel = new PositionsPanelModel();
    ordersPanelModel = new OrdersPanelModel();
    lineChartModel = new LineChartModel();
    ohlcChartModel = new OHLCChartModel();

    chartsSizingModel = new PanelSizingModel({defaultSize: 400, side: 'bottom'});

    get selectedPosition() {
        return this.positionsPanelModel.selectedRecord;
    }

    get selectedOrder() {
        return this.ordersPanelModel.selectedRecord;
    }

    get selectedOrderSymbol() {
        return this.selectedOrder ? this.selectedOrder.symbol : '';
    }

    constructor() {
        this.addReaction({
            track: () => this.selectedPosition,
            run: (record) => {
                this.ordersPanelModel.loadData(record.id);
            }
        });

        this.addReaction({
            track: () => this.selectedOrder,
            run: (record) => {
                this.lineChartModel.loadData(record);
                this.ohlcChartModel.loadData(record);
            }
        });
    }

}