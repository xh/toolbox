import {HoistModel} from '@xh/hoist/core';
import {bindable, observable} from '@xh/hoist/mobx';
import {PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';

import {StrategyGridModel} from './StrategyGridModel';
import {OrdersGridModel} from './OrdersGridModel';
import {LineChartModel} from './LineChartModel';
import {OHLCChartModel} from './OHLCChartModel';
import {PortfolioDimensionChooserModel} from './PortfolioDimensionChooserModel';

@HoistModel
export class PortfolioPanelModel {

    strategyGridModel = new StrategyGridModel();
    ordersGridModel = new OrdersGridModel();
    lineChartModel = new LineChartModel();
    olhcChartModel = new OHLCChartModel();
    dimensionChooserModel = new PortfolioDimensionChooserModel();

    leftSizingModel = new PanelSizingModel({
        defaultSize: 500,
        side: 'left'
    });

    bottomSizingModel = new PanelSizingModel({
        defaultSize: 400,
        side: 'bottom'
    });

    @bindable dimensions = ['model'];

    @observable loadTimestamp;

    get selectedOrderSymbol() {
        const rec = this.ordersGridModel.gridModel.selectedRecord;
        return rec ? rec.symbol : '';
    }

    constructor() {
        this.addReaction(this.loadStrategyGridReaction());
        this.addReaction(this.loadOrdersGridReaction());
        this.addReaction(this.loadLineChartReaction());
        this.addReaction(this.loadOLHCChartReaction());
    }

    loadStrategyGridReaction() {
        return {
            track: () => this.dimensionChooserModel.model.value,
            run: (dimensions) => {
                this.dimensions = dimensions;
                this.strategyGridModel.loadData(dimensions);
                this.loadTimestamp = Date.now();
            },
            fireImmediately: true
        };
    }

    loadOrdersGridReaction() {
        return {
            track: () => this.strategyGridModel.gridModel.selectedRecord,
            run: (record) => {
                this.ordersGridModel.loadData(record.id);
            }
        };
    }

    loadLineChartReaction() {
        return {
            track: () => this.ordersGridModel.gridModel.selectedRecord,
            run: (record) => {
                this.lineChartModel.loadData(record);
            }
        };
    }

    loadOLHCChartReaction() {
        return {
            track: () => this.ordersGridModel.gridModel.selectedRecord,
            run: (record) => {
                this.olhcChartModel.loadData(record);
            }
        };
    }
}