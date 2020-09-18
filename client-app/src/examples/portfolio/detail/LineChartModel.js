import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {ChartModel} from '@xh/hoist/cmp/chart';
import {fmtDate} from '@xh/hoist/format';
import {Highcharts} from '@xh/hoist/kit/highcharts';
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
                animation: false,
                marginLeft: 50
            },
            title: {text: null},
            tooltip: {outside: true},
            legend: {enabled: false},
            scrollbar: {enabled: false},

            rangeSelector: {
                enabled: true,
                selected: 1     // default to a 3-month zoom
            },
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
                    text: null
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
                            [1, new Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
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
        const {symbol} = this;
        if (isNil(symbol)) {
            this.chartModel.setSeries([]);
            return;
        }

        const series = await XH.portfolioService.getLineChartSeriesAsync({
            symbol,
            loadSpec
        }).catchDefault() ?? {};

        this.chartModel.setSeries([series]);
    }
}
