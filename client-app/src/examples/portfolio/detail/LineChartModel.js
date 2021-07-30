import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class LineChartModel extends HoistModel {

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
                    formatter: function() {
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

    async doLoadAsync(loadSpec) {
        const {symbol} = this;

        if (!symbol) {
            this.chartModel.clear();
            return;
        }

        const series = await XH.portfolioService
            .getLineChartSeriesAsync({symbol, loadSpec})
            .catchDefault();

        if (!loadSpec.isObsolete) {
            this.chartModel.setSeries(series ?? {});
        }
    }
}
