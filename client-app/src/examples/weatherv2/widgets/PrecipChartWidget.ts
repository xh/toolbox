import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, LoadSpec, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, computed, makeObservable} from '@xh/hoist/mobx';
import {WeatherWidgetModel} from '../dash/WeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {WidgetMeta} from '../dash/types';
import {WeatherData} from '../Types';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class PrecipChartModel extends WeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'precipChart',
        title: 'Precipitation',
        description:
            'Precipitation probability and volume over the forecast period. Dual-axis column chart.',
        category: 'display',
        inputs: [
            {
                name: 'city',
                type: 'string',
                required: true,
                default: 'New York',
                description: 'City to show precipitation for.'
            }
        ],
        outputs: [],
        config: {
            metric: {
                type: 'enum',
                description: 'What to display.',
                enum: ['probability', 'volume', 'both'],
                default: 'both'
            },
            showThresholds: {
                type: 'boolean',
                description: 'Highlight high-probability periods.',
                default: false
            }
        },
        defaultSize: {w: 6, h: 5},
        minSize: {w: 4, h: 3}
    };

    @managed chartModel: ChartModel;
    @bindable hasData: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }

    @computed get city(): string {
        return this.resolveInput('city') ?? 'New York';
    }

    get displayMetric(): string {
        return this.viewModel.viewState?.metric ?? 'both';
    }

    override onLinked() {
        super.onLinked();
        this.chartModel = this.createChartModel();

        this.addReaction({
            track: () => this.city,
            run: () => this.loadAsync(),
            fireImmediately: true
        });

        this.addReaction({
            track: () => [this.weatherData, this.displayMetric],
            run: () => this.updateChart()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {city} = this;
        if (!city) return;
        try {
            const {AppModel} = require('../AppModel');
            await AppModel.instance.weatherV2DashModel.weatherDataModel.ensureDataAsync(
                city,
                loadSpec
            );
        } catch (e) {
            // Handled by WeatherDataModel
        }
    }

    @computed get weatherData(): WeatherData | null {
        const {AppModel} = require('../AppModel');
        return AppModel.instance.weatherV2DashModel.weatherDataModel.getData(this.city);
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

    private updateChart() {
        const data = this.weatherData;
        if (!data?.forecast?.length) return;

        const {forecast} = data,
            {displayMetric} = this,
            probData = [],
            volumeData = [];

        let anyPrecip = false;

        for (const entry of forecast) {
            const time = entry.dt;
            if (entry.precipProbability > 0 || entry.precipVolume > 0) anyPrecip = true;
            probData.push([time, entry.precipProbability]);
            volumeData.push([time, Math.round(entry.precipVolume * 10) / 10]);
        }

        this.hasData = anyPrecip;

        if (!anyPrecip) return;

        const series = [];
        if (displayMetric === 'probability' || displayMetric === 'both') {
            series.push({
                name: 'Probability',
                type: 'column',
                data: probData,
                yAxis: 0,
                color: 'rgba(135, 175, 220, 0.6)',
                borderWidth: 0,
                tooltip: {valueSuffix: '%'}
            });
        }
        if (displayMetric === 'volume' || displayMetric === 'both') {
            series.push({
                name: 'Rain Volume',
                type: 'column',
                data: volumeData,
                yAxis: 1,
                color: '#2171b5',
                borderWidth: 0,
                tooltip: {valueSuffix: ' mm'}
            });
        }

        this.chartModel.setSeries(series);
    }
}

widgetRegistry.register(PrecipChartModel.meta);

//--------------------------------------------------
// Component
//--------------------------------------------------
export const precipChartWidget = hoistCmp.factory({
    displayName: 'PrecipChartWidget',
    model: creates(PrecipChartModel),

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
