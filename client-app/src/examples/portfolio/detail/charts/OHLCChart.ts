import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp, HoistModel, LoadSpec, lookup, managed, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {errorMessage} from '@xh/hoist/dynamics/desktop';
import {fmtDate, fmtPrice} from '@xh/hoist/format';
import {ChartsModel} from './ChartsModel';

export const ohlcChart = hoistCmp.factory({
    model: creates(() => OHLCChartModel),

    render({model}) {
        const {lastLoadException} = model;
        return panel({
            item: lastLoadException ? errorMessage({error: model.lastLoadException}) : chart(),
            mask: 'onLoad'
        });
    }
});

class OHLCChartModel extends HoistModel {
    @lookup(ChartsModel) parentModel: ChartsModel;
    @managed chartModel: ChartModel;

    get symbol() {
        return this.parentModel.symbol;
    }

    override onLinked() {
        this.chartModel = new ChartModel({
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

        this.addReaction({
            track: () => this.symbol,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {symbol, chartModel} = this;

        if (!symbol) {
            chartModel.clear();
            return;
        }

        try {
            const series = await XH.portfolioService.getOHLCChartSeriesAsync({symbol, loadSpec});
            if (loadSpec.isStale) return;

            chartModel.setSeries(series);
        } catch (e) {
            if (loadSpec.isAutoRefresh || loadSpec.isStale) return;

            chartModel.clear();
            XH.handleException(e, {showAlert: false});
            throw e;
        }
    }
}
