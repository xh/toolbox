import {HoistModel} from '@xh/hoist/core';
import {fmtDate, numberRenderer} from '@xh/hoist/format';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {PortfolioDataService} from './PortfolioDataService';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {ChartModel} from '@xh/hoist/desktop/cmp/chart';
import Highcharts from 'highcharts/highstock';
import {isNil} from 'lodash';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class PortfolioPanelModel {

    portfolioDataService = new PortfolioDataService();
    portfolioLoadModel = new PendingTaskModel();
    ordersLoadModel = new PendingTaskModel();
    lineChartLoadModel = new PendingTaskModel();
    olhcChartLoadModel = new PendingTaskModel();

    @bindable dimensions = ['model'];
    strategyGridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'volume', 'pnl']
        }),
        sortBy: [{colId: 'name', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                headerName: 'Name',
                width: 200,
                field: 'name',
                isTreeColumn: true
            },
            {
                headerName: 'Volume',
                field: 'volume',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            },
            {...emptyFlexCol}
        ]
    });

    ordersGridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'symbol', 'time', 'dir']
        }),
        sortBy: [{colId: 'time', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                field: 'id',
                headerName: 'ID',
                hide: true
            },
            {
                field: 'symbol',
                headerName: 'Instrument',
                width: 100,
                tooltip: false
            },
            {
                field: 'time',
                headerName: 'Execution Time',
                align: 'right',
                width: 150,
                tooltip: false
            },
            {
                field: 'dir',
                headerName: 'Direction',
                width: 100,
                tooltip: false
            },
            {...emptyFlexCol}
        ]
    });

    olhcChartModel = new ChartModel({
        config: {
            chart: {
                type: 'ohlc',
                spacingLeft: 3,
                spacingBottom: 5,
                zoomType: 'x',
                resetZoomButton: {
                    theme: {
                        display: 'none'
                    }
                }
            },
            legend: {
                enabled: false
            },
            title: {
                text: null
            },
            scrollbar: {
                enabled: false
            },
            xAxis: {
                labels: {
                    formatter: function() {
                        return fmtDate(this.value);
                    }
                }
            },
            yAxis: {
                title: {text: null},
                opposite: false,
                endOnTick: true,
                showLastLabel: true,
                tickPixelInterval: 40,
                maxPadding: 0,
                labels: {
                    y: 3,
                    x: -8
                }
            },
            tooltip: {
                split: false,
                crosshairs: false,
                followPointer: true,
                formatter: function() {
                    const p = this.point;
                    return `
                        ${fmtDate(this.x)}<br>
                        <b>${p.series.name}</b><br>
                        Open: ${p.open}<br>
                        High: ${p.high}<br>
                        Low: ${p.low}<br>
                        Close: ${p.close}<br>
                    `;
                }
            }
        }
    });

    lineChartModel = new ChartModel({
        config: {
            chart: {
                zoomType: 'x'
            },
            title: {
                text: 'Trade Volume over time'
            },
            subtitle: {
                text: 'Click and drag in the plot area to zoom in'
            },
            scrollbar: {
                enabled: false
            },
            rangeSelector: {
                enabled: true
            },
            navigator: {
                enabled: true
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: {
                title: {
                    text: 'USD'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            }
        }
    });

    constructor() {
        this.addReaction(this.loadDimensionReaction());
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
                this.portfolioDataService.getPortfolio(this.dimensions.slice())
                    .then((portfolio) => {
                        this.strategyGridModel.loadData(portfolio);
                        this.strategyGridModel.selectFirst();
                    })
                    .linkTo(this.portfolioLoadModel);
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
            track: () => this.strategyGridModel.selectedRecord,
            run: (record) => {
                if (!isNil(record)) {
                    this.portfolioDataService.getOrders(record.id)
                        .then((orders) => {
                            this.ordersGridModel.loadData(orders);
                            if (orders.length > 0) {
                                this.ordersGridModel.selectFirst();
                            }
                        })
                        .linkTo(this.ordersLoadModel);
                } else {
                    this.ordersGridModel.loadData([]);
                }
            }
        };
    }

    loadLineChartReaction() {
        return {
            track: () => this.ordersGridModel.selectedRecord,
            run: (record) => {
                if (!isNil(record)) {
                    this.portfolioDataService.getLineChartSeries(record.symbol)
                        .then((series) => {
                            this.lineChartModel.setSeries(series);
                        }).linkTo(this.lineChartLoadModel);
                } else {
                    this.lineChartModel.setSeries([]);
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