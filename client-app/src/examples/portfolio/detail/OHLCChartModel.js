import {HoistModel, managed, XH} from '@xh/hoist/core';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {isNil} from 'lodash';
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
                spacingLeft: 3,
                spacingBottom: 5,
                zoomType: 'x',
                animation: false,
                marginLeft: 50
            },
            title: {text: null},
            legend: {enabled: false},
            scrollbar: {enabled: false},
            rangeSelector: {
                enabled: true,
                selected: 1     // default to a 3-month zoom
            },
            navigator: {enabled: true},
            xAxis: {
                labels: {
                    formatter: function() {
                        return fmtDate(this.value, {fmt: 'DD-MMM-YY'});
                    }
                }
            },
            yAxis: {
                title: {text: null},
                opposite: false,
                endOnTick: true,
                showLastLabel: true,
                tickPixelInterval: 40
            },
            tooltip: {
                split: false,
                crosshairs: false,
                followPointer: true,
                useHTML: true,
                formatter: function() {
                    const p = this.point;
                    return `
                        <div class="tbox-pos-chart-tip__title"><b>${p.series.name}</b> ${fmtDate(this.x)}</div>
                        <table class="tbox-pos-chart-tip">
                            <tr><th>Open:</th><td>${fmtPrice(p.open)}</td></tr>
                            <tr><th>High:</th><td>${fmtPrice(p.high)}</td></tr>
                            <tr><th>Low:</th><td>${fmtPrice(p.low)}</td></tr>
                            <tr><th>Close:</th><td>${fmtPrice(p.close)}</td></tr>
                        </table>
                    `;
                }
            },
            exporting: {
                enabled: true
            }
        }
    });

    async doLoadAsync(loadSpec) {
        const {symbol} = this;
        if (isNil(symbol)) {
            this.chartModel.setSeries([]);
            return;
        }

        const series = await XH.portfolioService.getOHLCChartSeriesAsync({
            symbol,
            loadSpec
        }).catchDefault() ?? {};

        this.chartModel.setSeries([series]);
    }
}
