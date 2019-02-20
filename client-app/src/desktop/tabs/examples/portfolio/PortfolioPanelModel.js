import {HoistModel, LoadSupport, managed, loadAllAsync} from '@xh/hoist/core';
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
        this.addReaction(this.selectedPositionReaction());
        this.addReaction(this.selectedOrderReaction());
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([
            this.positionsPanelModel,
            this.ordersPanelModel,
            this.lineChartModel,
            this.ohlcChartModel
        ], loadSpec);
    }

    //----------------------------------------
    // Implementations
    //----------------------------------------
    selectedPositionReaction() {
        return {
            track: () => this.selectedPosition,
            run: (position) => {
                this.ordersPanelModel.setPositionId(position ? position.id : null);
            },
            delay: 500
        };
    }

    selectedOrderReaction() {
        return {
            track: () => this.selectedOrder,
            run: (order) => {
                const symbol = order ? order.symbol : null;
                this.setDisplayedOrderSymbol(symbol || '');
                this.lineChartModel.setOrderSymbol(symbol);
                this.ohlcChartModel.setOrderSymbol(symbol);
            },
            delay: 500
        };
    }
}