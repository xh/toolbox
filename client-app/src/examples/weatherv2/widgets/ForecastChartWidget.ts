import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp, LoadSpec, managed, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {computed, makeObservable} from '@xh/hoist/mobx';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {settingsAwarePanel} from './settingsAwarePanel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {convertTemp, tempUnit} from '../dash/unitUtils';
import {WidgetMeta} from '../dash/types';
import {WeatherData} from '../Types';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class ForecastChartModel extends BaseWeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'forecastChart',
        title: 'Forecast Chart',
        description:
            'Multi-series line/area/column chart showing forecast data over time. Configurable series selection and chart type.',
        category: 'display',
        inputs: [
            {
                name: 'city',
                type: 'city',
                required: true,
                default: 'New York',
                description: 'City to show forecast for.'
            },
            {
                name: 'units',
                type: 'units',
                required: false,
                default: 'imperial',
                enum: ['imperial', 'metric'],
                description: 'Unit system: "imperial" or "metric".'
            }
        ],
        outputs: [],
        config: {
            series: {
                type: 'string[]',
                description:
                    'Data series to display. Options: "temp", "feelsLike", "humidity", "pressure".',
                default: ['temp', 'feelsLike']
            },
            chartType: {
                type: 'enum',
                enum: ['line', 'area', 'column'],
                default: 'line'
            },
            showLegend: {type: 'boolean', default: true},
            hidePanelHeader: {
                type: 'boolean',
                default: false,
                description: 'Hide widget header bar when manual editing is disabled'
            }
        },
        defaultSize: {w: 8, h: 8},
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

    get activeSeries(): string[] {
        return this.viewModel.viewState?.series ?? ['temp', 'feelsLike'];
    }

    get chartType(): string {
        return this.viewModel.viewState?.chartType ?? 'line';
    }

    get showLegend(): boolean {
        return this.viewModel.viewState?.showLegend ?? true;
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
            track: () => [this.weatherData, this.units, this.activeSeries, this.chartType],
            run: () => this.updateChart(),
            fireImmediately: true
        });

        this.addReaction({
            track: () => this.showLegend,
            run: showLegend =>
                this.chartModel.updateHighchartsConfig({legend: {enabled: showLegend}})
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
                legend: {enabled: this.showLegend},
                credits: {enabled: false}
            }
        });
    }

    private updateChart() {
        const data = this.weatherData;
        if (!data?.forecast?.length) return;

        const {forecast} = data,
            {units, activeSeries, chartType} = this,
            tUnit = tempUnit(units),
            seriesData = [];

        const seriesConfig: Record<string, any> = {
            temp: {
                name: 'Temperature',
                color: '#7cb5ec',
                suffix: tUnit,
                convert: (v: number) => convertTemp(v, units)
            },
            feelsLike: {
                name: 'Feels Like',
                color: '#f45b5b',
                suffix: tUnit,
                convert: (v: number) => convertTemp(v, units),
                dashStyle: 'ShortDash'
            },
            humidity: {name: 'Humidity', color: '#90ed7d', suffix: '%', convert: (v: number) => v},
            pressure: {
                name: 'Pressure',
                color: '#8085e9',
                suffix: ' hPa',
                convert: (v: number) => v
            }
        };

        for (const key of activeSeries) {
            const cfg = seriesConfig[key];
            if (!cfg) continue;

            const points = forecast.map(entry => [
                entry.dt,
                Math.round(cfg.convert(entry[key] ?? entry.temp) * 10) / 10
            ]);

            seriesData.push({
                name: cfg.name,
                type: chartType === 'line' ? 'spline' : chartType,
                data: points,
                color: cfg.color,
                lineWidth: 2,
                marker: {enabled: false},
                dashStyle: cfg.dashStyle,
                tooltip: {valueSuffix: cfg.suffix}
            });
        }

        this.chartModel.setSeries(seriesData);
    }
}

widgetRegistry.register(ForecastChartModel.meta);

//--------------------------------------------------
// Component
//--------------------------------------------------
export const forecastChartWidget = hoistCmp.factory({
    displayName: 'ForecastChartWidget',
    model: creates(ForecastChartModel),

    render({model}) {
        return settingsAwarePanel(model, chart());
    }
});
