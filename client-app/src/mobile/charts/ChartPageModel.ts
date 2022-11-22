import {HoistModel, managed} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {action, observable, makeObservable} from '@xh/hoist/mobx';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {App} from '../AppModel';

export class ChartPageModel extends HoistModel {

    @observable currentSymbol: string = '';
    @observable.ref symbols: string[] = null;

    @action setCurrentSymbol(v: string) {this.currentSymbol = v}
    @action setSymbols(v: string[]) {this.symbols = v}

    numCompanies: number = 3;

    @managed
    chartModel: ChartModel = new ChartModel({highchartsConfig: this.getChartModelCfg()});

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.currentSymbol,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        if (!this.symbols) {
            let symbols = await App.portfolioService.getSymbolsAsync({loadSpec});
            symbols = symbols.slice(0, this.numCompanies);
            this.setSymbols(symbols);
        }

        if (!this.currentSymbol) {
            this.setCurrentSymbol(this.symbols[0]);
        }

        let series = await App.portfolioService.getOHLCChartSeriesAsync({
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
                type: 'ohlc',
                zoomType: 'x'
            },
            rangeSelector: {enabled: true, selected: 5},
            navigator: {enabled: true},
            title: {text: null},
            legend: {enabled: false},
            scrollbar: {enabled: false},
            xAxis: {
                labels: {
                    formatter: function() {
                        return fmtDate(this.value, {asHtml: true});
                    }
                }
            },
            yAxis: {
                title: {text: null},
                opposite: true,
                endOnTick: true,
                showLastLabel: true
            },
            tooltip: {
                useHTML: true,
                formatter: function() {
                    const p = this.point,
                        opts = {asHtml: true};
                    return `
                        <div class="xh-chart-tooltip">
                        <div class="xh-chart-tooltip__title"><b>${p.series.name}</b> ${fmtDate(this.x, opts)}</div>
                        <table>
                            <tr><th>Open:</th><td>${fmtPrice(p.open, opts)}</td></tr>
                            <tr><th>High:</th><td>${fmtPrice(p.high, opts)}</td></tr>
                            <tr><th>Low:</th><td>${fmtPrice(p.low, opts)}</td></tr>
                            <tr><th>Close:</th><td>${fmtPrice(p.close, opts)}</td></tr>
                        </table>
                        </div>
                    `;
                }
            }
        };
    }
}