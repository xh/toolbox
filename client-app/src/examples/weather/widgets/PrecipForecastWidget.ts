import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {ForecastResponse} from '../Types';
import {AppModel} from '../AppModel';

export const precipForecastWidget = hoistCmp.factory({
    model: creates(() => PrecipForecastModel),

    render({model}) {
        return panel({
            item: model.hasData
                ? chart()
                : placeholder({
                      items: [Icon.sun(), 'No precipitation expected in the forecast period']
                  })
        });
    }
});

class PrecipForecastModel extends HoistModel {
    @managed chartModel: ChartModel;
    @bindable hasData: boolean = false;

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
                        title: {text: 'Probability (%)'},
                        max: 100,
                        min: 0,
                        labels: {format: '{value}%'}
                    },
                    {
                        title: {text: 'Volume (mm)'},
                        min: 0,
                        opposite: true,
                        labels: {format: '{value} mm'}
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
            probData = [],
            volumeData = [];

        let anyPrecip = false;

        items.forEach(item => {
            const time = item.dt * 1000,
                pop = Math.round((item.pop ?? 0) * 100),
                rain = item.rain?.['3h'] ?? 0;

            if (pop > 0 || rain > 0) anyPrecip = true;

            probData.push([time, pop]);
            volumeData.push([time, Math.round(rain * 10) / 10]);
        });

        this.hasData = anyPrecip;

        if (anyPrecip) {
            this.chartModel.setSeries([
                {
                    name: 'Probability',
                    type: 'column',
                    data: probData,
                    yAxis: 0,
                    color: 'rgba(135, 175, 220, 0.6)',
                    borderWidth: 0,
                    tooltip: {valueSuffix: '%'}
                },
                {
                    name: 'Rain Volume',
                    type: 'column',
                    data: volumeData,
                    yAxis: 1,
                    color: '#2171b5',
                    borderWidth: 0,
                    tooltip: {valueSuffix: ' mm'}
                }
            ]);
        }
    }
}
