import {HoistModel, XH, managed, LoadSupport} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/desktop/cmp/chart';
import {fmtDate} from '@xh/hoist/format';
import Highcharts from 'highcharts/highstock';
import {isNil} from 'lodash';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class LineChartModel {

    @bindable orderSymbol = null;

    constructor() {
        this.addReaction({
            track: () => this.orderSymbol,
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
            tooltip: {outside: true},
            legend: {enabled: false},
            scrollbar: {enabled: false},
            rangeSelector: {enabled: false},
            navigator: {enabled: true},
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
                title: {
                    text: 'Volume'
                }
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
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

        const series = await XH.portfolioService.getLineChartSeriesAsync(orderSymbol);
        this.chartModel.setSeries([series]);
    }
}