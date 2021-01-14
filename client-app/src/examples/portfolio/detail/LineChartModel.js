import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {fmtDate} from '@xh/hoist/format';
import {isNil} from 'lodash';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class LineChartModel {

    @bindable symbol = null;

    constructor() {
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
                floor: 0,
                opposite: true,
                title: {text: null}
            },
            tooltip: {outside: true},
            exporting: {enabled: true}
        }
    });

    async doLoadAsync(loadSpec) {
        const {symbol} = this;
        if (isNil(symbol)) {
            this.chartModel.clear();
            return;
        }

        const series = await XH.portfolioService.getLineChartSeriesAsync({
            symbol,
            loadSpec
        }).catchDefault() ?? {};

        this.chartModel.setSeries(series);
    }
}
