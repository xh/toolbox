import {hoistCmp, creates, HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {fmtDate} from '@xh/hoist/format';


export const chartPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        return chart({minWidth: 200, minHeight: 200});
    }
});

@HoistModel
@LoadSupport
class Model {

    @managed
    chartModel = new ChartModel({highchartsConfig: this.getChartModelCfg()});

    async doLoadAsync(loadSpec) {
        const symbols = await XH.portfolioService.getSymbolsAsync(),
            symbol = symbols[0],
            series = await XH.portfolioService.getOHLCChartSeriesAsync(symbol);

        const groupPixelWidth = 5;
        Object.assign(series, {
            dataGrouping: {
                enabled: !!groupPixelWidth,
                groupPixelWidth: groupPixelWidth
            }
        });

        this.chartModel.setSeries([series]);
    }

    getChartModelCfg() {
        return {
            chart: {
                type: 'ohlc',
                spacingLeft: 3,
                spacingBottom: 5,
                zoomType: 'x',
                resetZoomButton: {
                    theme: {
                        display: 'none'
                    }
                }
            },
            legend: {
                enabled: false
            },
            title: {
                text: null
            },
            scrollbar: {
                enabled: false
            },
            xAxis: {
                labels: {
                    formatter: function() {
                        return fmtDate(this.value);
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
        };
    }
}