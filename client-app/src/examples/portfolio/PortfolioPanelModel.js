import {HoistModel, LoadSupport, managed, loadAllAsync} from '@xh/hoist/core';
import {PositionsPanelModel} from './PositionsPanelModel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {LineChartModel} from './LineChartModel';
import {OHLCChartModel} from './OHLCChartModel';
import {bindable} from '@xh/hoist/mobx';
import {SplitTreeMapModel} from '@xh/hoist/desktop/cmp/treemap';

@HoistModel
@LoadSupport
export class PortfolioPanelModel {

    @managed positionsPanelModel = new PositionsPanelModel();
    @managed splitTreeMapModel = new SplitTreeMapModel({
        gridModel: this.positionsPanelModel.gridModel,
        filter: (rec) => {
            return rec.pnl >= 0;
        },
        treeMapModelConfig: {
            labelField: 'name',
            valueField: 'pnl',
            heatField: 'pnl',
            valueFieldLabel: 'Pnl'
        },
        orientation: 'horizontal'
    });
    @managed ordersPanelModel = new OrdersPanelModel();
    @managed lineChartModel = new LineChartModel();
    @managed ohlcChartModel = new OHLCChartModel();

    @bindable displayedOrderSymbol = '';
    @bindable selectedOrder = null;

    get selectedPosition() {
        return this.positionsPanelModel.selectedRecord;
    }

    // get selectedOrder() {
    //     return this.ordersPanelModel.selectedRecord;
    // }

    constructor() {
        this.addReaction(this.selectedPositionReaction());
        this.addReaction(this.selectedOrderReaction());
        this.setSelectedOrder(this.ordersPanelModel.selectedRecord);
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([
            this.positionsPanelModel,
            // this.splitTreeMapModel,
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
            track: () => this.ordersPanelModel.selectedRecord,
            run: (order) => {
                const orderStr = order ? order.symbol : 'null';
                console.log('ORDER: '+orderStr);
                if (order) {
                    this.setSelectedOrder(order);
                    const symbol = order.symbol;
                    this.setDisplayedOrderSymbol(symbol || '');
                    this.lineChartModel.setOrderSymbol(symbol);
                    this.ohlcChartModel.setOrderSymbol(symbol);
                }
            },
            delay: 500
        };
    }
}