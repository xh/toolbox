import {HoistModel, managed} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {isEmpty} from 'lodash';
import {App} from '../../../apps/app';

export class OHLCChartModel extends HoistModel {

    @bindable currentSymbol = '';
    @bindable.ref symbols = [];
    @bindable aspectRatio = null;

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

    async doLoadAsync(loadSpec) {
        if (isEmpty(this.symbols)) {
            let symbols = await App.portfolioService.getSymbolsAsync({loadSpec});
            symbols = symbols.slice(0, 5);
            this.setSymbols(symbols);
        }

        if (!this.currentSymbol) {
            this.setCurrentSymbol(this.symbols[0]);
        }

        let series = await App.portfolioService.getOHLCChartSeriesAsync({
            symbol: this.currentSymbol,
            loadSpec
        }).catchDefault() ?? {};

        Object.assign(series, {
            dataGrouping: {
                enabled: true,
                groupPixelWidth: 5
            }
        });

        this.chartModel.setSeries(series);
    }

    getChartModelCfg() {
        return {
            chart: {
                type: 'ohlc',
                zoomType: 'x',
                animation: false
            },
            exporting: {enabled: true},
            rangeSelector: {enabled: true, selected: 4},
            legend: {enabled: false},
            scrollbar: {enabled: false},
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function() {
                        return fmtDate(this.value, {asHtml: true});
                    }
                }
            },
            yAxis: {
                opposite: true,
                title: {text: null}
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
