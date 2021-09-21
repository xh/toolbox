import {HoistModel, managed, XH} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {isEmpty} from 'lodash';

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
            let symbols = await XH.portfolioService.getSymbolsAsync({loadSpec});
            symbols = symbols.slice(0, 5);
            this.setSymbols(symbols);
        }

        if (!this.currentSymbol) {
            this.setCurrentSymbol(this.symbols[0]);
        }

        let series = await XH.portfolioService.getOHLCChartSeriesAsync({
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
                        return fmtDate(this.value);
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
                    const p = this.point;
                    return `
                        <div class="xh-chart-tooltip">
                        <div class="xh-chart-tooltip__title"><b>${p.series.name}</b> ${fmtDate(this.x)}</div>
                        <table>
                            <tr><th>Open:</th><td>${fmtPrice(p.open)}</td></tr>
                            <tr><th>High:</th><td>${fmtPrice(p.high)}</td></tr>
                            <tr><th>Low:</th><td>${fmtPrice(p.low)}</td></tr>
                            <tr><th>Close:</th><td>${fmtPrice(p.close)}</td></tr>
                        </table>
                        </div>
                    `;
                }
            }
        };
    }
}
