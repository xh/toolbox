import {HoistModel, XH} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import Highcharts from 'highcharts/highstock';

export class LineChartModel extends HoistModel {

    @bindable currentSymbol = '';
    @bindable.ref symbols = null;
    numCompanies = 3;
    chartModel = new ChartModel({highchartsConfig: this.getChartModelCfg()});

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.currentSymbol,
            run: () => this.loadAsync()
        });
    }
    
    async doLoadAsync(loadSpec) {
        if (!this.symbols) {
            let symbols = await XH.portfolioService.getSymbolsAsync({loadSpec});
            symbols = symbols.slice(0, this.numCompanies);
            this.setSymbols(symbols);
        }

        if (!this.currentSymbol) {
            this.setCurrentSymbol(this.symbols[0]);
        }

        let series = await XH.portfolioService.getLineChartSeriesAsync({
            symbol: this.currentSymbol,
            dimension: 'close',
            loadSpec
        }).catchDefault() ?? {};

        Object.assign(series, {
            type: 'area',
            animation: true
        });

        this.chartModel.setSeries([series]);
    }

    getChartModelCfg() {
        return {
            chart: {
                zoomType: 'x'
            },
            title: {
                text: 'Stock price over time'
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
                            [1, new Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
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
            },
            exporting: {
                enabled: true
            }
        };
    }
}
