import {HoistModel, LoadSupport, managed} from '@xh/hoist/core';
import {PositionsPanelModel} from './PositionsPanelModel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {LineChartModel} from './LineChartModel';
import {OHLCChartModel} from './OHLCChartModel';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class PortfolioPanelModel {

    @managed positionsPanelModel = new PositionsPanelModel();
    @managed ordersPanelModel = new OrdersPanelModel();
    @managed lineChartModel = new LineChartModel();
    @managed ohlcChartModel = new OHLCChartModel();

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
            run: this.loadOrders,
            delay: 500
        });

        this.addReaction({
            track: () => this.selectedOrder,
            run: this.loadCharts,
            delay: 500
        });
    }

    async doLoadAsync(loadSpec) {
        await this.positionsPanelModel.loadAsync(loadSpec);
    }

    //----------------------------------------
    // Implementations
    //----------------------------------------
    loadOrders() {
        this.ordersPanelModel.loadAsync({position: this.selectedPosition});
    }

    loadCharts() {
        const {selectedOrder} = this;
        this.setDisplayedOrderSymbol(selectedOrder ? selectedOrder.symbol : '');
        this.lineChartModel.loadAsync({order: selectedOrder});
        this.ohlcChartModel.loadAsync({order: selectedOrder});
    }
}