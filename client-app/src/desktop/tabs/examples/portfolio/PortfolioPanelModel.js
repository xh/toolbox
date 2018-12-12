import {HoistModel} from '@xh/hoist/core';
import {PositionsPanelModel} from './PositionsPanelModel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {LineChartModel} from './LineChartModel';
import {OHLCChartModel} from './OHLCChartModel';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class PortfolioPanelModel {

    positionsPanelModel = new PositionsPanelModel();
    ordersPanelModel = new OrdersPanelModel();
    lineChartModel = new LineChartModel();
    ohlcChartModel = new OHLCChartModel();
    @bindable displayedOrderSymbol = '';

    get selectedPosition() {
        return this.positionsPanelModel.selectedRecord;
    }

    get selectedOrder() {
        return this.ordersPanelModel.selectedRecord;
    }

    constructor() {
        this.addReaction({
            track: () => this.selectedPosition,
            run: (record) => {
                if (record) this.ordersPanelModel.loadOrdersForPositionAsync(record.id);
            },
            delay: 500
        });

        this.addReaction({
            track: () => this.selectedOrder,
            run: (record) => {
                this.setDisplayedOrderSymbol(record ? record.symbol : '');
                this.lineChartModel.loadData(record);
                this.ohlcChartModel.loadData(record);
            },
            delay: 500
        });
    }

}