import {HoistModel, XH} from '@xh/hoist/core';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {ChartModel} from '@xh/hoist/desktop/cmp/chart';
import {fmtDate} from '@xh/hoist/format';
import Highcharts from 'highcharts/highstock';
import {isNil} from 'lodash';

@HoistModel
export class LineChartModel {

    loadModel = new PendingTaskModel();
    lineChartModel = new ChartModel({
        config: {
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
            }
        }
    });

    loadData(record) {
        if (isNil(record)) {
            this.lineChartModel.setSeries([]);
            return;
        }

        XH.portfolioService
            .getLineChartSeries(record.symbol)
            .then(series => this.lineChartModel.setSeries(series))
            .linkTo(this.loadModel);
    }

}