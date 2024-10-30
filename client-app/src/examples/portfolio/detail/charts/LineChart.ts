import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp, HoistModel, LoadSpec, lookup, managed, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {ChartsModel} from './ChartsModel';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {errorMessage} from '@xh/hoist/dynamics/desktop';

export const lineChart = hoistCmp.factory({
    model: creates(() => LineChartModel),

    render({model}) {
        const {lastLoadException} = model;
        return panel({
            item: lastLoadException ? errorMessage({error: model.lastLoadException}) : chart(),
            mask: 'onLoad'
        });
    }
});

class LineChartModel extends HoistModel {
    @lookup(ChartsModel) parentModel: ChartsModel;
    @managed chartModel: ChartModel;

    get symbol() {
        return this.parentModel.symbol;
    }

    override onLinked() {
        this.chartModel = new ChartModel({
            highchartsConfig: {
                chart: {
                    zoomType: 'x',
                    animation: false
                },
                title: {text: null},
                legend: {enabled: false},
                navigator: {enabled: true},
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
                    floor: 0,
                    opposite: true,
                    title: {text: null}
                },
                tooltip: {outside: true}
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
            const series = await XH.portfolioService.getLineChartSeriesAsync({symbol, loadSpec});
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
