import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {div, hbox, img, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, LoadSpec, managed, XH} from '@xh/hoist/core';
import {computed, makeObservable} from '@xh/hoist/mobx';
import {WeatherWidgetModel} from '../dash/WeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {fmtTemp, fmtWind} from '../dash/unitUtils';
import {WidgetMeta} from '../dash/types';
import {WeatherData} from '../Types';
import '../WeatherV2.scss';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class CurrentConditionsModel extends WeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'currentConditions',
        title: 'Current Conditions',
        description:
            'Current weather snapshot — temperature gauge, conditions icon, and key details.',
        category: 'display',
        inputs: [
            {
                name: 'city',
                type: 'string',
                required: true,
                default: 'New York',
                description: 'City to display.'
            },
            {
                name: 'units',
                type: 'string',
                required: false,
                default: 'imperial',
                description: 'Unit system: "imperial" or "metric".'
            }
        ],
        outputs: [],
        config: {
            showFeelsLike: {
                type: 'boolean',
                description: 'Show feels-like temperature.',
                default: true
            },
            showHumidity: {
                type: 'boolean',
                description: 'Show humidity percentage.',
                default: true
            },
            showWind: {type: 'boolean', description: 'Show wind speed.', default: true}
        },
        defaultSize: {w: 4, h: 5},
        minSize: {w: 3, h: 3}
    };

    @managed chartModel: ChartModel;

    constructor() {
        super();
        makeObservable(this);
    }

    @computed
    get city(): string {
        return this.resolveInput('city') ?? 'New York';
    }

    @computed
    get units(): string {
        return this.resolveInput('units') ?? 'imperial';
    }

    get showFeelsLike(): boolean {
        return this.viewModel.viewState?.showFeelsLike ?? true;
    }

    get showHumidity(): boolean {
        return this.viewModel.viewState?.showHumidity ?? true;
    }

    get showWind(): boolean {
        return this.viewModel.viewState?.showWind ?? true;
    }

    override onLinked() {
        super.onLinked();

        this.chartModel = this.createChartModel();

        this.addReaction({
            track: () => this.city,
            run: () => this.loadAsync(),
            fireImmediately: true
        });

        // Update chart when data or units change
        this.addReaction({
            track: () => [this.weatherData, this.units],
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
            // Data model handles caching — errors will show via lastLoadException
        }
    }

    @computed
    get weatherData(): WeatherData | null {
        return XH.weatherDataService.getData(this.city);
    }

    private createChartModel(): ChartModel {
        return new ChartModel({
            highchartsConfig: {
                chart: {type: 'solidgauge'},
                title: {text: null},
                pane: {
                    center: ['50%', '70%'],
                    size: '130%',
                    startAngle: -90,
                    endAngle: 90,
                    background: {
                        innerRadius: '60%',
                        outerRadius: '100%',
                        shape: 'arc',
                        borderWidth: 0,
                        backgroundColor: '#eeeeee'
                    }
                },
                yAxis: {
                    min: this.units === 'metric' ? -30 : -20,
                    max: this.units === 'metric' ? 50 : 120,
                    lineWidth: 0,
                    tickWidth: 0,
                    minorTickInterval: null,
                    tickAmount: 2,
                    labels: {y: 16, style: {fontSize: '12px'}},
                    stops: [
                        [0.15, '#2196F3'],
                        [0.4, '#f7931c'],
                        [0.6, '#FF9800'],
                        [0.85, '#F44336']
                    ]
                },
                tooltip: {enabled: false},
                credits: {enabled: false},
                plotOptions: {
                    solidgauge: {
                        dataLabels: {
                            y: -25,
                            borderWidth: 0,
                            useHTML: true
                        }
                    }
                },
                series: [{name: 'Temperature', data: [0], innerRadius: '60%'}]
            }
        });
    }

    private updateChart() {
        const data = this.weatherData;
        if (!data?.current) return;

        const {units} = this,
            temp = data.current.temp,
            displayTemp = fmtTemp(temp, units);

        const chartTemp = units === 'metric' ? Math.round(((temp - 32) * 5) / 9) : Math.round(temp);

        this.chartModel.setSeries([
            {
                name: 'Temperature',
                data: [chartTemp],
                innerRadius: '60%',
                dataLabels: {
                    format: `<div style="text-align:center"><span style="font-size:24px">${displayTemp}</span></div>`
                }
            }
        ]);

        // Update gauge range for units
        const yAxis = units === 'metric' ? {min: -30, max: 50} : {min: -20, max: 120};
        this.chartModel.updateHighchartsConfig({yAxis});
    }
}

widgetRegistry.register(CurrentConditionsModel.meta);

//--------------------------------------------------
// Component
//--------------------------------------------------
export const currentConditionsWidget = hoistCmp.factory({
    displayName: 'CurrentConditionsWidget',
    model: creates(CurrentConditionsModel),

    render({model}) {
        const data = model.weatherData;
        if (!data?.current) return null;

        const {current} = data,
            {units} = model;

        const details = [];
        if (model.showFeelsLike && current.feelsLike != null) {
            details.push(`Feels like ${fmtTemp(current.feelsLike, units)}`);
        }
        if (model.showHumidity && current.humidity != null) {
            details.push(`Humidity: ${current.humidity}%`);
        }
        if (model.showWind && current.windSpeed != null) {
            details.push(`Wind: ${fmtWind(current.windSpeed, units)}`);
        }

        const description =
            current.description.charAt(0).toUpperCase() + current.description.slice(1);

        return vbox({
            className: 'weather-v2-current-conditions',
            alignItems: 'center',
            flex: 1,
            items: [
                chart({className: 'weather-v2-current-conditions__gauge'}),
                hbox({
                    className: 'weather-v2-current-conditions__details',
                    items: [
                        current.iconCode
                            ? img({
                                  className: 'weather-v2-current-conditions__icon',
                                  src: `https://openweathermap.org/img/wn/${current.iconCode}@2x.png`,
                                  alt: description
                              })
                            : null,
                        vbox({
                            className: 'weather-v2-current-conditions__text',
                            items: [
                                div({
                                    className: 'weather-v2-current-conditions__description',
                                    item: description
                                }),
                                div({item: details.join(' · ')})
                            ]
                        })
                    ]
                })
            ]
        });
    }
});
