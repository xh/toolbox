import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp, HoistModel, lookup, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtDate} from '@xh/hoist/format';
import type {ForecastResponse} from '../Types';
import type {WeatherDashModel} from '../WeatherDashModel';

export const windForecastWidget = hoistCmp.factory({
    model: creates(() => WindForecastModel),

    render() {
        return panel({
            item: chart()
        });
    }
});

class WindForecastModel extends HoistModel {
    @lookup((m: WeatherDashModel) => !!m.isWeatherDashModel) dashModel: WeatherDashModel;

    @managed chartModel: ChartModel;

    override onLinked() {
        this.chartModel = this.createChartModel();

        this.addReaction({
            track: () => this.dashModel.forecast,
            run: data => this.updateChart(data),
            fireImmediately: true
        });
    }

    private createChartModel(): ChartModel {
        return new ChartModel({
            highchartsConfig: {
                chart: {type: 'spline', zoomType: 'x'},
                title: {text: null},
                xAxis: {
                    type: 'datetime',
                    labels: {
                        formatter: function () {
                            return fmtDate(this.value, {fmt: 'ddd ha'});
                        }
                    }
                },
                yAxis: {
                    title: {text: 'Speed (mph)'},
                    min: 0,
                    labels: {format: '{value} mph'}
                },
                tooltip: {
                    shared: true,
                    valueSuffix: ' mph',
                    xDateFormat: '%A %b %e, %l:%M %p'
                },
                legend: {enabled: true},
                credits: {enabled: false}
            }
        });
    }

    private updateChart(data: ForecastResponse) {
        if (!data?.list) return;

        const items = data.list,
            speedData = [],
            gustData = [];

        items.forEach(item => {
            const time = item.dt * 1000,
                speed = Math.round(item.wind?.speed ?? 0),
                gust = Math.round(item.wind?.gust ?? item.wind?.speed ?? 0);

            speedData.push([time, speed]);
            gustData.push([time, gust]);
        });

        this.chartModel.setSeries([
            {
                name: 'Wind Speed',
                data: speedData,
                color: '#7cb5ec',
                lineWidth: 2,
                marker: {enabled: false}
            },
            {
                name: 'Gusts',
                data: gustData,
                color: '#f45b5b',
                lineWidth: 1,
                dashStyle: 'ShortDash',
                marker: {enabled: false}
            }
        ]);
    }
}
