import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class OHLCChartModel extends HoistModel {

    @bindable symbol = null;

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.symbol,
            run: () => this.loadAsync()
        });
    }

    @managed
    chartModel = new ChartModel({
        highchartsConfig: {
            chart: {
                type: 'ohlc',
                zoomType: 'x',
                animation: false
            },
            title: {text: null},
            legend: {enabled: false},
            scrollbar: {enabled: true},
            rangeSelector: {
                enabled: true,
                selected: 1     // default to a 3-month zoom
            },
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function() {
                        return fmtDate(this.value, {fmt: 'DD-MMM-YY'});
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
        }
    });

    async doLoadAsync(loadSpec) {
        const {symbol} = this;

        if (!symbol) {
            this.chartModel.clear();
            return;
        }

        const series = await XH.portfolioService
            .getOHLCChartSeriesAsync({symbol, loadSpec})
            .catchDefault();

        if (!loadSpec.isObsolete) {
            this.chartModel.setSeries(series ?? {});
        }
    }
}
