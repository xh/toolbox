import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp, LoadSpec, managed, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {computed, makeObservable} from '@xh/hoist/mobx';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {settingsAwarePanel} from './settingsAwarePanel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {convertWind, windUnit} from '../dash/unitUtils';
import {WidgetMeta} from '../dash/types';
import {WeatherData} from '../Types';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class WindChartModel extends BaseWeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'windChart',
        title: 'Wind',
        description: 'Wind speed and gusts over the forecast period.',
        category: 'display',
        inputs: [
            {
                name: 'city',
                type: 'city',
                required: true,
                default: 'New York',
                description: 'City to show wind data for.'
            },
            {
                name: 'units',
                type: 'units',
                required: false,
                default: 'imperial',
                description: 'Unit system (mph vs m/s).'
            }
        ],
        outputs: [],
        config: {
            showGusts: {
                type: 'boolean',
                description: 'Show gust data alongside sustained.',
                default: true
            },
            chartType: {
                type: 'enum',
                description: 'Chart style.',
                enum: ['line', 'area'],
                default: 'line'
            }
        },
        defaultSize: {w: 6, h: 8},
        minSize: {w: 4, h: 5}
    };

    @managed chartModel: ChartModel;

    constructor() {
        super();
        makeObservable(this);
    }

    @computed get city(): string {
        return this.resolveInput('city') ?? 'New York';
    }

    @computed get units(): string {
        return this.resolveInput('units') ?? 'imperial';
    }

    get showGusts(): boolean {
        return this.viewModel.viewState?.showGusts ?? true;
    }

    get chartType(): string {
        return this.viewModel.viewState?.chartType ?? 'line';
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
            track: () => [this.weatherData, this.units, this.showGusts],
            run: () => this.updateChart(),
            fireImmediately: true
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {city} = this;
        if (!city) return;
        try {
            await XH.weatherDataService.ensureDataAsync(city, loadSpec);
        } catch (e) {
            // Handled by WeatherDataService
        }
    }

    @computed get weatherData(): WeatherData | null {
        return XH.weatherDataService.getData(this.city);
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
                    title: {text: null},
                    labels: {format: '{value}'}
                },
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
            {units, showGusts, chartType} = this,
            wUnit = windUnit(units),
            speedData = [],
            gustData = [];

        const type = chartType === 'line' ? 'spline' : chartType;

        for (const entry of forecast) {
            const speed = Math.round(convertWind(entry.windSpeed, units) * 10) / 10;
            speedData.push([entry.dt, speed]);
            if (showGusts) {
                const gust = entry.windGust
                    ? Math.round(convertWind(entry.windGust, units) * 10) / 10
                    : speed;
                gustData.push([entry.dt, gust]);
            }
        }

        const series: any[] = [
            {
                name: 'Wind Speed',
                type,
                data: speedData,
                color: '#7cb5ec',
                lineWidth: 2,
                marker: {enabled: false},
                tooltip: {valueSuffix: ` ${wUnit}`}
            }
        ];

        if (showGusts) {
            series.push({
                name: 'Gusts',
                type,
                data: gustData,
                color: '#f45b5b',
                lineWidth: 2,
                dashStyle: 'ShortDash',
                marker: {enabled: false},
                tooltip: {valueSuffix: ` ${wUnit}`}
            });
        }

        this.chartModel.setSeries(series);
    }
}

widgetRegistry.register(WindChartModel.meta);

//--------------------------------------------------
// Component
//--------------------------------------------------
export const windChartWidget = hoistCmp.factory({
    displayName: 'WindChartWidget',
    model: creates(WindChartModel),

    render({model}) {
        return settingsAwarePanel(model, chart());
    }
});
