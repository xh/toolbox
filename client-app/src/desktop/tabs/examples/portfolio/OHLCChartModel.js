import {HoistModel, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {ChartModel} from '@xh/hoist/desktop/cmp/chart';
import {isNil} from 'lodash';

@HoistModel
export class OHLCChartModel {

    loadModel = new PendingTaskModel();

    olhcChartModel = new ChartModel({
        config: {
            chart: {
                type: 'ohlc',
                spacingLeft: 3,
                spacingBottom: 5,
                zoomType: 'x',
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
                formatter: function() {
                    const p = this.point;
                    return `
                        ${fmtDate(this.x)}<br>
                        <b>${p.series.name}</b><br>
                        Open: ${p.open}<br>
                        High: ${p.high}<br>
                        Low: ${p.low}<br>
                        Close: ${p.close}<br>
                    `;
                }
            }
        }
    });

    loadData(record) {
        if (isNil(record)) {
            this.olhcChartModel.setSeries([]);
            return;
        }

        XH.portfolioService
            .getOLHCChartSeries(record.symbol)
            .then(series => this.olhcChartModel.setSeries(series))
            .linkTo(this.loadModel);
    }

}