import {HoistModel, XH, LoadSupport, managed} from '@xh/hoist/core';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {ChartModel} from '@xh/hoist/desktop/cmp/chart';
import {isNil} from 'lodash';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class OHLCChartModel {

    @bindable orderSymbol = null;

    constructor() {
        this.addReaction({
            track: () => this.orderSymbol,
            run: this.loadAsync
        });
    }

    @managed
    chartModel = new ChartModel({
        config: {
            chart: {
                type: 'ohlc',
                spacingLeft: 3,
                spacingBottom: 5,
                zoomType: 'x',
                animation: false,
                resetZoomButton: {
                    theme: {display: 'none'}
                }
            },
            title: {text: null},
            legend: {enabled: false},
            scrollbar: {enabled: false},
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
        const {orderSymbol} = this;
        if (isNil(orderSymbol)) {
            this.chartModel.setSeries([]);
            return;
        }

        const series = await XH.portfolioService.getOLHCChartSeries(orderSymbol);
        this.chartModel.setSeries(series);
    }
}