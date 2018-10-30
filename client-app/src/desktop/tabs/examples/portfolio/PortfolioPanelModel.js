import {HoistModel} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {PortfolioDataService} from './PortfolioDataService';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {ChartModel} from '@xh/hoist/desktop/cmp/chart';
import Highcharts from 'highcharts/highstock';
import {isNil} from 'lodash';
import {bindable} from '@xh/hoist/mobx';
import {StrategyGridModel} from './StrategyGridModel';
import {OrdersGridModel} from './OrdersGridModel';
import {LineChartModel} from './LineChartModel';
import {OLHCChartModel} from './OLHCChartModel';

@HoistModel
export class PortfolioPanelModel {

    portfolioDataService = new PortfolioDataService();
    strategyGridModel = new StrategyGridModel();
    ordersGridModel = new OrdersGridModel();
    lineChartModel = new LineChartModel();
    olhcChartModel = new OLHCChartModel();

    @bindable dimensions = ['model'];


    // lineChartLoadModel = new PendingTaskModel();
    // olhcChartLoadModel = new PendingTaskModel();
    //
    //
    // olhcChartModel = new ChartModel({
    //     config: {
    //         chart: {
    //             type: 'ohlc',
    //             spacingLeft: 3,
    //             spacingBottom: 5,
    //             zoomType: 'x',
    //             resetZoomButton: {
    //                 theme: {
    //                     display: 'none'
    //                 }
    //             }
    //         },
    //         legend: {
    //             enabled: false
    //         },
    //         title: {
    //             text: null
    //         },
    //         scrollbar: {
    //             enabled: false
    //         },
    //         xAxis: {
    //             labels: {
    //                 formatter: function() {
    //                     return fmtDate(this.value);
    //                 }
    //             }
    //         },
    //         yAxis: {
    //             title: {text: null},
    //             opposite: false,
    //             endOnTick: true,
    //             showLastLabel: true,
    //             tickPixelInterval: 40,
    //             maxPadding: 0,
    //             labels: {
    //                 y: 3,
    //                 x: -8
    //             }
    //         },
    //         tooltip: {
    //             split: false,
    //             crosshairs: false,
    //             followPointer: true,
    //             formatter: function() {
    //                 const p = this.point;
    //                 return `
    //                     ${fmtDate(this.x)}<br>
    //                     <b>${p.series.name}</b><br>
    //                     Open: ${p.open}<br>
    //                     High: ${p.high}<br>
    //                     Low: ${p.low}<br>
    //                     Close: ${p.close}<br>
    //                 `;
    //             }
    //         }
    //     }
    // });
    //
    // lineChartModel = new ChartModel({
    //     config: {
    //         chart: {
    //             zoomType: 'x'
    //         },
    //         title: {
    //             text: 'Trade Volume over time'
    //         },
    //         subtitle: {
    //             text: 'Click and drag in the plot area to zoom in'
    //         },
    //         scrollbar: {
    //             enabled: false
    //         },
    //         rangeSelector: {
    //             enabled: true
    //         },
    //         navigator: {
    //             enabled: true
    //         },
    //         xAxis: {
    //             type: 'datetime'
    //         },
    //         yAxis: {
    //             title: {
    //                 text: 'USD'
    //             }
    //         },
    //         legend: {
    //             enabled: false
    //         },
    //         plotOptions: {
    //             area: {
    //                 fillColor: {
    //                     linearGradient: {
    //                         x1: 0,
    //                         y1: 0,
    //                         x2: 0,
    //                         y2: 1
    //                     },
    //                     stops: [
    //                         [0, Highcharts.getOptions().colors[0]],
    //                         [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
    //                     ]
    //                 },
    //                 marker: {
    //                     radius: 2
    //                 },
    //                 lineWidth: 1,
    //                 states: {
    //                     hover: {
    //                         lineWidth: 1
    //                     }
    //                 },
    //                 threshold: null
    //             }
    //         }
    //     }
    // });

    constructor() {
        // this.addReaction(this.loadDimensionReaction());
        this.addReaction(this.loadPortfolioReaction());
        this.addReaction(this.loadOrdersReaction());
        this.addReaction(this.loadLineChartReaction());
        this.addReaction(this.loadOLHCChartReaction());
    }

    // loadPortfolioDimensionReaction() {
    //     return {
    //         track: () => this.di
    //         run: () => {
    //             this.portfolioDataService.getPortfolio(['model', 'symbol'])
    //                 .then((portfolio) => {
    //                     this.strategyGridModel.loadData(portfolio);
    //                     this.strategyGridModel.selectFirst();
    //                 })
    //                 .linkTo(this.portfolioLoadModel);
    //         },
    //         fireImmediately: true
    //     };
    // }

    loadPortfolioReaction() {
        return {
            track: () => this.portfolioDataService.portfolioVersion,
            run: () => {
                this.portfolioDataService.getPortfolioAsync(this.dimensions.slice())
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
            track: () => this.dimensions,
            run: () => {
                this.portfolioDataService.getPortfolio(this.dimensions.slice())
                    .then((portfolio) => {
                        this.strategyGridModel.loadData(portfolio);
                        this.strategyGridModel.selectFirst();
                    })
                    .linkTo(this.portfolioLoadModel);
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
                            console.log('HERE', orders);
                            this.ordersGridModel.gridModel.loadData(orders);
                            console.log('HERE NOW');
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
            track: () => this.ordersGridModel.selectedRecord,
            run: (record) => {
                if (!isNil(record)) {
                    this.portfolioDataService.getOLHCChartSeries(record.symbol)
                        .then((series) => {
                            this.olhcChartModel.setSeries(series);
                        }).linkTo(this.olhcChartLoadModel);
                } else {
                    this.olhcChartModel.setSeries([]);
                }
            }
        };
    }
}