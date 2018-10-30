import {HoistModel} from '@xh/hoist/core';
import {PortfolioDataService} from './PortfolioDataService';
import {isNil} from 'lodash';
import {bindable} from '@xh/hoist/mobx';
import {StrategyGridModel} from './StrategyGridModel';
import {OrdersGridModel} from './OrdersGridModel';
import {LineChartModel} from './LineChartModel';
import {OLHCChartModel} from './OLHCChartModel';
import {PortfolioDimensionChooserModel} from './PortfolioDimensionChooserModel';

@HoistModel
export class PortfolioPanelModel {

    portfolioDataService = new PortfolioDataService();
    strategyGridModel = new StrategyGridModel();
    ordersGridModel = new OrdersGridModel();
    lineChartModel = new LineChartModel();
    olhcChartModel = new OLHCChartModel();
    dimensionChooserModel = new PortfolioDimensionChooserModel();

    @bindable dimensions = ['model'];

    constructor() {
        this.addReaction(this.loadDimensionReaction());
        this.addReaction(this.loadPortfolioReaction());
        this.addReaction(this.loadOrdersReaction());
        this.addReaction(this.loadLineChartReaction());
        this.addReaction(this.loadOLHCChartReaction());
    }

    loadPortfolioReaction() {
        return {
            track: () => this.portfolioDataService.portfolioVersion,
            run: () => {
                this.portfolioDataService.getPortfolioAsync(this.dimensions)
                    .then((portfolio) => {
                        this.strategyGridModel.gridModel.loadData(portfolio);
                        this.strategyGridModel.gridModel.selectFirst();
                    })
                    .linkTo(this.strategyGridModel.loadModel);
            },
            fireImmediately: true
        };
    }

    loadDimensionReaction() {
        return {
            track: () => this.dimensionChooserModel.model.dimensions,
            run: (dimensions) => {
                this.dimensions = dimensions;
                this.portfolioDataService.getPortfolioAsync(this.dimensions)
                    .then((portfolio) => {
                        this.strategyGridModel.gridModel.loadData(portfolio);
                        this.strategyGridModel.gridModel.selectFirst();
                    })
                    .linkTo(this.strategyGridModel.loadModel);
            }
        };
    }

    loadOrdersReaction() {
        return {
            track: () => this.strategyGridModel.gridModel.selectedRecord,
            run: (record) => {
                if (!isNil(record)) {
                    this.portfolioDataService.getOrders(record.id)
                        .then((orders) => {
                            this.ordersGridModel.gridModel.loadData(orders);
                            if (orders.length > 0) {
                                this.ordersGridModel.gridModel.selectFirst();
                            }
                        })
                        .linkTo(this.ordersGridModel.loadModel);
                } else {
                    this.ordersGridModel.gridModel.loadData([]);
                }
            }
        };
    }

    loadLineChartReaction() {
        return {
            track: () => this.ordersGridModel.gridModel.selectedRecord,
            run: (record) => {
                if (!isNil(record)) {
                    this.portfolioDataService.getLineChartSeries(record.symbol)
                        .then((series) => {
                            this.lineChartModel.lineChartModel.setSeries(series);
                        }).linkTo(this.lineChartModel.loadModel);
                } else {
                    this.lineChartModel.lineChartModel.setSeries([]);
                }
            }
        };
    }

    loadOLHCChartReaction() {
        return {
            track: () => this.ordersGridModel.gridModel.selectedRecord,
            run: (record) => {
                if (!isNil(record)) {
                    this.portfolioDataService.getOLHCChartSeries(record.symbol)
                        .then((series) => {
                            this.olhcChartModel.olhcChartModel.setSeries(series);
                        }).linkTo(this.olhcChartModel.loadModel);
                } else {
                    this.olhcChartModel.olhcChartModel.setSeries([]);
                }
            }
        };
    }
}