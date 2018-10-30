import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {StrategyGridModel} from './StrategyGridModel';
import {OrdersGridModel} from './OrdersGridModel';
import {LineChartModel} from './LineChartModel';
import {OLHCChartModel} from './OLHCChartModel';
import {PortfolioDimensionChooserModel} from './PortfolioDimensionChooserModel';

@HoistModel
export class PortfolioPanelModel {

    strategyGridModel = new StrategyGridModel();
    ordersGridModel = new OrdersGridModel();
    lineChartModel = new LineChartModel();
    olhcChartModel = new OLHCChartModel();
    dimensionChooserModel = new PortfolioDimensionChooserModel();

    @bindable dimensions = ['model'];

    constructor() {
        this.addReaction(this.loadStrategyGridReaction());
        this.addReaction(this.loadOrdersGridReaction());
        this.addReaction(this.loadLineChartReaction());
        this.addReaction(this.loadOLHCChartReaction());
    }

    loadStrategyGridReaction() {
        return {
            track: () => this.dimensionChooserModel.model.dimensions,
            run: (dimensions) => {
                this.dimensions = dimensions;
                this.strategyGridModel.loadData(dimensions);
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