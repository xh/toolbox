import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtDate} from '@xh/hoist/format';
import {makeObservable} from '@xh/hoist/mobx';
import {ForecastResponse} from '../Types';
import {AppModel} from '../AppModel';

export const tempForecastWidget = hoistCmp.factory({
    model: creates(() => TempForecastModel),

    render() {
        return panel({
            item: chart()
        });
    }
});

class TempForecastModel extends HoistModel {
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
                yAxis: {
                    title: {text: 'Temperature (°F)'},
                    labels: {format: '{value}°'}
                },
                tooltip: {
                    shared: true,
                    valueSuffix: '°F',
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
            tempData = [],
            feelsLikeData = [];

        items.forEach(item => {
            const time = item.dt * 1000,
                temp = item.main.temp,
                feelsLike = item.main.feels_like;

            tempData.push([time, Math.round(temp)]);
            feelsLikeData.push([time, Math.round(feelsLike)]);
        });

        this.chartModel.setSeries([
            {
                name: 'Temperature',
                type: 'spline',
                data: tempData,
                color: '#7cb5ec',
                lineWidth: 2,
                marker: {enabled: false}
            },
            {
                name: 'Feels Like',
                type: 'spline',
                data: feelsLikeData,
                color: '#f45b5b',
                lineWidth: 2,
                dashStyle: 'ShortDash',
                marker: {enabled: false}
            }
        ]);
    }
}
