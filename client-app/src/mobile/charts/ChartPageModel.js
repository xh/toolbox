import {HoistModel, managed, XH} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {fmtDate} from '@xh/hoist/format';

export class ChartPageModel extends HoistModel {

    @bindable
    currentSymbol = '';

    @bindable.ref
    symbols = null;

    numCompanies = 3;

    @managed
    chartModel = new ChartModel({highchartsConfig: this.getChartModelCfg()});

    @bindable
    aspectRatio = null;

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

        let series = await XH.portfolioService.getOHLCChartSeriesAsync({
            symbol: this.currentSymbol,
            loadSpec
        }).catchDefault() ?? {};

        const groupPixelWidth = 5;
        Object.assign(series, {
            dataGrouping: {
                enabled: !!groupPixelWidth,
                groupPixelWidth: groupPixelWidth
            }
        });

        this.chartModel.setSeries(series);
    }

    getChartModelCfg() {
        return {
            chart: {
                type: 'ohlc'
            },
            title: {text: null},
            legend: {enabled: false},
            scrollbar: {enabled: false},
            xAxis: {
                labels: {
                    formatter: function() {
                        return fmtDate(this.value);
                    }
                }
            },
            yAxis: {
                title: {text: null},
                opposite: true,
                endOnTick: true,
                showLastLabel: true
            }
        };
    }
}