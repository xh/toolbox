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
            run: this.loadOrdersAsync,
            delay: 500
        });

        this.addReaction({
            track: () => this.selectedOrder,
            run: (order) => {
                this.setDisplayedOrderSymbol(order ? order.symbol : '');
                this.loadChartsAsync();
            },
            delay: 500
        });
    }

    async doLoadAsync(loadSpec) {
        await this.positionsPanelModel.loadAsync(loadSpec);
        await this.loadOrdersAsync(loadSpec);
        await this.loadChartsAsync(loadSpec);
    }

    //----------------------------------------
    // Implementations
    //----------------------------------------
    async loadOrdersAsync(loadSpec) {
        this.ordersPanelModel.loadPositionAsync(this.selectedPosition, loadSpec);
    }

    async loadChartsAsync(loadSpec) {
        const {selectedOrder} = this;
        this.lineChartModel.loadOrderAsync(selectedOrder, loadSpec);
        this.ohlcChartModel.loadOrderAsync(selectedOrder, loadSpec);
    }
}