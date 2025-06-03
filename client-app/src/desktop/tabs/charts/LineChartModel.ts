import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {observable, makeObservable, runInAction, bindable} from '@xh/hoist/mobx';
import Highcharts from 'highcharts/highstock';
import {isEmpty} from 'lodash';

export class LineChartModel extends HoistModel {
    @bindable currentSymbol: string = '';
    @observable.ref symbols: string[] = [];

    @managed
    chartModel = new ChartModel({highchartsConfig: this.getChartModelCfg()});

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => this.currentSymbol,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        if (isEmpty(this.symbols)) {
            let symbols = await XH.portfolioService.getSymbolsAsync({loadSpec});
            runInAction(() => (this.symbols = symbols.slice(0, 5)));
        }

        if (!this.currentSymbol) {
            runInAction(() => (this.currentSymbol = this.symbols[0]));
            return; // Reaction to `currentSymbol` value change will trigger final run.
        }

        let series =
            (await XH.portfolioService
                .getLineChartSeriesAsync({
                    symbol: this.currentSymbol,
                    dimension: 'close',
                    loadSpec
                })
                .catchDefault()) ?? {};

        Object.assign(series, {
            type: 'area',
            animation: true
        });

        this.chartModel.setSeries(series);
    }

    private getChartModelCfg() {
        const fillColor = Highcharts.getOptions().colors[0];
        return {
            chart: {zoomType: 'x'},
            navigator: {enabled: true},
            rangeSelector: {enabled: true},
            exporting: {enabled: false},
            legend: {enabled: false},
            scrollbar: {enabled: false},
            xAxis: {type: 'datetime'},
            yAxis: {title: {text: 'USD'}},
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, fillColor],
                            [1, 'rgba(255,255,255,0)']
                        ]
                    },
                    lineWidth: 1,
                    states: {
                        hover: {lineWidth: 1}
                    },
                    threshold: null
                }
            }
        };
    }
}
