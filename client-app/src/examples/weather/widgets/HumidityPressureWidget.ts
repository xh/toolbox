import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtDate} from '@xh/hoist/format';
import {makeObservable} from '@xh/hoist/mobx';
import {ForecastResponse} from '../Types';
import {AppModel} from '../AppModel';

export const humidityPressureWidget = hoistCmp.factory({
    model: creates(() => HumidityPressureModel),

    render() {
        return panel({
            item: chart()
        });
    }
});

class HumidityPressureModel extends HoistModel {
    @managed chartModel: ChartModel;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.chartModel = this.createChartModel();

        this.addReaction({
            track: () => AppModel.instance.weatherDashModel.forecast,
            run: data => this.updateChart(data),
            fireImmediately: true
        });
    }

    private createChartModel(): ChartModel {
        return new ChartModel({
            highchartsConfig: {
                chart: {zoomType: 'x'},
                title: {text: null},
                xAxis: {
                    type: 'datetime',
                    labels: {
                        formatter: function () {
                            return fmtDate(this.value, {fmt: 'ddd ha'});
                        }
                    }
                },
                yAxis: [
                    {
                        title: {text: 'Humidity (%)'},
                        max: 100,
                        min: 0,
                        labels: {format: '{value}%'}
                    },
                    {
                        title: {text: 'Pressure (hPa)'},
                        opposite: true,
                        labels: {format: '{value} hPa'}
                    }
                ],
                tooltip: {
                    shared: true,
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
            humidityData = [],
            pressureData = [];

        items.forEach(item => {
            const time = item.dt * 1000,
                humidity = item.main?.humidity ?? 0,
                pressure = item.main?.pressure ?? 0;

            humidityData.push([time, humidity]);
            pressureData.push([time, pressure]);
        });

        this.chartModel.setSeries([
            {
                name: 'Humidity',
                type: 'spline',
                data: humidityData,
                yAxis: 0,
                color: '#7cb5ec',
                lineWidth: 2,
                marker: {enabled: false},
                tooltip: {valueSuffix: '%'}
            },
            {
                name: 'Pressure',
                type: 'spline',
                data: pressureData,
                yAxis: 1,
                color: '#90ed7d',
                lineWidth: 2,
                marker: {enabled: false},
                tooltip: {valueSuffix: ' hPa'}
            }
        ]);
    }
}
