import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp, HoistModel, lookup, managed, XH} from '@xh/hoist/core';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {ChartsPanelModel} from './ChartsPanelModel';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {bindable} from '@xh/hoist/mobx';
import {errorMessage} from '@xh/hoist/dynamics/desktop';

export const ohlcChart = hoistCmp.factory({
    model: creates(() => OHLCChartModel),
    render({model}) {
        if (model.error) {
            return errorMessage({error: model.error});
        }
        return panel({
            item: chart(),
            mask: 'onLoad',
            flex: 1
        });
    }
});

class OHLCChartModel extends HoistModel {
    @lookup(ChartsPanelModel) parentModel;
    @bindable.ref error;

    get symbol() {
        return this.parentModel.symbol;
    }

    override onLinked() {
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
                selected: 1 // default to a 3-month zoom
            },
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function () {
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
                formatter: function () {
                    const p = this.point;
                    return `
                        <div class="xh-chart-tooltip">
                        <div class="xh-chart-tooltip__title"><b>${p.series.name}</b> ${fmtDate(
                            this.x
                        )}</div>
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

    override async doLoadAsync(loadSpec) {
        const {symbol, chartModel} = this;
        this.error = null;

        if (!symbol) {
            chartModel.clear();
            return;
        }

        try {
            const series = await XH.portfolioService.getOHLCChartSeriesAsync({symbol, loadSpec});
            if (!loadSpec.isObsolete) {
                chartModel.setSeries(series);
            }
        } catch (e) {
            this.error = e;
            chartModel.clear();
            XH.handleException(e, {showAlert: false});
        }
    }
}
