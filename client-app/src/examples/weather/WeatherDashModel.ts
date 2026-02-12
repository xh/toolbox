import {HoistModel, LoadSpec, managed, persist, XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';

import {
    calendarDaysIcon,
    cloudRainIcon,
    dropletPercentIcon,
    temperatureIcon,
    windIcon
} from './Icons';
import {CurrentWeatherResponse, ForecastResponse} from './Types';
import {currentConditionsWidget} from './widgets/CurrentConditionsWidget';
import {tempForecastWidget} from './widgets/TempForecastWidget';
import {precipForecastWidget} from './widgets/PrecipForecastWidget';
import {windForecastWidget} from './widgets/WindForecastWidget';
import {humidityPressureWidget} from './widgets/HumidityPressureWidget';
import {conditionsSummaryWidget} from './widgets/ConditionsSummaryWidget';

export const CITIES = [
    'Atlanta',
    'Austin',
    'Boston',
    'Chicago',
    'Dallas',
    'Denver',
    'Houston',
    'Las Vegas',
    'London',
    'Los Angeles',
    'Miami',
    'Minneapolis',
    'Nashville',
    'New York',
    'Paris',
    'Philadelphia',
    'Phoenix',
    'Portland',
    'San Antonio',
    'San Diego',
    'San Francisco',
    'Seattle',
    'Sydney',
    'Tokyo',
    'Toronto'
];

export class WeatherDashModel extends HoistModel {
    override persistWith = {localStorageKey: 'xhWeatherDash'};

    @bindable @persist selectedCity: string = 'New York';
    @observable.ref currentWeather: CurrentWeatherResponse = null;
    @observable.ref forecast: ForecastResponse = null;

    viewManagerModel: ViewManagerModel;
    @managed dashCanvasModel: DashCanvasModel;

    constructor(viewManagerModel: ViewManagerModel) {
        super();
        makeObservable(this);

        this.viewManagerModel = viewManagerModel;
        this.dashCanvasModel = new DashCanvasModel({
            persistWith: {viewManagerModel},
            viewSpecDefaults: {
                unique: true
            },
            viewSpecs: [
                {
                    id: 'currentConditions',
                    title: 'Current Conditions',
                    icon: Icon.sun(),
                    content: currentConditionsWidget,
                    width: 4,
                    height: 5
                },
                {
                    id: 'tempForecast',
                    title: 'Temperature Forecast',
                    icon: temperatureIcon(),
                    content: tempForecastWidget,
                    width: 8,
                    height: 5
                },
                {
                    id: 'precipForecast',
                    title: 'Precipitation',
                    icon: cloudRainIcon(),
                    content: precipForecastWidget,
                    width: 6,
                    height: 5
                },
                {
                    id: 'windForecast',
                    title: 'Wind',
                    icon: windIcon(),
                    content: windForecastWidget,
                    width: 6,
                    height: 5
                },
                {
                    id: 'humidityPressure',
                    title: 'Humidity & Pressure',
                    icon: dropletPercentIcon(),
                    content: humidityPressureWidget,
                    width: 6,
                    height: 5
                },
                {
                    id: 'conditionsSummary',
                    title: '5-Day Summary',
                    icon: calendarDaysIcon(),
                    content: conditionsSummaryWidget,
                    width: 6,
                    height: 5
                }
            ],
            initialState: [
                {viewSpecId: 'currentConditions', layout: {x: 0, y: 0, w: 4, h: 5}},
                {viewSpecId: 'tempForecast', layout: {x: 4, y: 0, w: 8, h: 5}},
                {viewSpecId: 'precipForecast', layout: {x: 0, y: 5, w: 6, h: 5}},
                {viewSpecId: 'windForecast', layout: {x: 6, y: 5, w: 6, h: 5}},
                {viewSpecId: 'humidityPressure', layout: {x: 0, y: 10, w: 6, h: 5}},
                {viewSpecId: 'conditionsSummary', layout: {x: 6, y: 10, w: 6, h: 5}}
            ]
        });

        this.addReaction({
            track: () => this.selectedCity,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {selectedCity} = this;
        if (!selectedCity) return;

        try {
            const [currentWeather, forecast] = await Promise.all([
                XH.fetchJson({url: 'weather/current', params: {city: selectedCity}, loadSpec}),
                XH.fetchJson({url: 'weather/forecast', params: {city: selectedCity}, loadSpec})
            ]);

            if (loadSpec.isStale) return;

            runInAction(() => {
                this.currentWeather = currentWeather;
                this.forecast = forecast;
            });
        } catch (e) {
            if (loadSpec.isAutoRefresh || loadSpec.isStale) return;
            XH.handleException(e);
        }
    }
}
