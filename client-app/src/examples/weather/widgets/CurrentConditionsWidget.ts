import {chart, ChartModel} from '@xh/hoist/cmp/chart';
import {div, hbox, img, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {makeObservable} from '@xh/hoist/mobx';
import {CurrentWeatherResponse} from '../Types';
import {AppModel} from '../AppModel';

export const currentConditionsWidget = hoistCmp.factory({
    model: creates(() => CurrentConditionsModel),

    render({model}) {
        const {currentWeather} = AppModel.instance.weatherDashModel;
        if (!currentWeather) return null;

        const description = currentWeather.weather?.[0]?.description ?? '',
            iconCode = currentWeather.weather?.[0]?.icon,
            feelsLike = currentWeather.main?.feels_like,
            humidity = currentWeather.main?.humidity,
            wind = currentWeather.wind?.speed;

        return vbox({
            className: 'weather-current-conditions',
            alignItems: 'center',
            flex: 1,
            items: [
                chart({className: 'weather-current-conditions__gauge'}),
                hbox({
                    className: 'weather-current-conditions__details',
                    items: [
                        iconCode
                            ? img({
                                  className: 'weather-current-conditions__icon',
                                  src: `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
                                  alt: description
                              })
                            : null,
                        vbox({
                            className: 'weather-current-conditions__text',
                            items: [
                                div({
                                    className: 'weather-current-conditions__description',
                                    item: description.charAt(0).toUpperCase() + description.slice(1)
                                }),
                                div({
                                    item: [
                                        feelsLike != null
                                            ? `Feels like ${Math.round(feelsLike)}°F`
                                            : null,
                                        humidity != null ? `Humidity: ${humidity}%` : null,
                                        wind != null ? `Wind: ${Math.round(wind)} mph` : null
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    }
});

class CurrentConditionsModel extends HoistModel {
    @managed chartModel: ChartModel;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.chartModel = this.createChartModel();

        this.addReaction({
            track: () => AppModel.instance.weatherDashModel.currentWeather,
            run: data => this.updateChart(data),
            fireImmediately: true
        });
    }

    private createChartModel(): ChartModel {
        return new ChartModel({
            highchartsConfig: {
                chart: {
                    type: 'solidgauge'
                },
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
                    min: -20,
                    max: 120,
                    lineWidth: 0,
                    tickWidth: 0,
                    minorTickInterval: null,
                    tickAmount: 2,
                    labels: {
                        y: 16,
                        style: {fontSize: '12px'}
                    },
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
                            useHTML: true,
                            format: '<div style="text-align:center"><span style="font-size:24px">{y}°F</span></div>'
                        }
                    }
                },
                series: [
                    {
                        name: 'Temperature',
                        data: [0],
                        innerRadius: '60%',
                        dataLabels: {
                            format: '<div style="text-align:center"><span style="font-size:24px">{y}°F</span></div>'
                        }
                    }
                ]
            }
        });
    }

    private updateChart(data: CurrentWeatherResponse) {
        if (!data?.main) return;
        const temp = Math.round(data.main.temp);
        this.chartModel.setSeries([
            {
                name: 'Temperature',
                data: [temp],
                innerRadius: '60%',
                dataLabels: {
                    format: `<div style="text-align:center"><span style="font-size:24px">{y}°F</span></div>`
                }
            }
        ]);
    }
}
