import type {LoadSpec} from '@xh/hoist/core';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import type {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import type {DashCanvasItemState, DashCanvasViewSpec} from '@xh/hoist/desktop/cmp/dash';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';

import type {CurrentWeatherResponse, ForecastResponse} from './Types';

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

export interface WeatherDashConfig {
    viewManagerModel: ViewManagerModel;
    /** Widget catalog - supplied by the app so this model need not import the widgets. */
    viewSpecs: DashCanvasViewSpec[];
    /** Default widget layout, applied when no saved view is selected. */
    initialState: DashCanvasItemState[];
}

export class WeatherDashModel extends HoistModel {
    override telemetryPrefix = 'toolbox.client.weather';
    override persistWith = {localStorageKey: 'xhWeatherDash'};

    @bindable @persist accessor selectedCity: string = 'New York';
    @observableRef accessor currentWeather: CurrentWeatherResponse = null;
    @observableRef accessor forecast: ForecastResponse = null;

    viewManagerModel: ViewManagerModel;
    @managed dashCanvasModel: DashCanvasModel;

    /**
     * Marker supporting type-safe context lookup from the dashboard widgets. Lets them select this
     * model with `@lookup((m: WeatherDashModel) => m.isWeatherDashModel)` and so import it as a
     * *type* only - keeping their dependency on it off the runtime module graph.
     */
    get isWeatherDashModel(): boolean {
        return true;
    }

    constructor({viewManagerModel, viewSpecs, initialState}: WeatherDashConfig) {
        super();

        this.viewManagerModel = viewManagerModel;
        this.dashCanvasModel = new DashCanvasModel({
            persistWith: {viewManagerModel},
            viewSpecDefaults: {
                unique: true
            },
            viewSpecs,
            initialState
        });

        this.addReaction({
            track: () => this.selectedCity,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {selectedCity} = this;
        if (!selectedCity) return;

        await this.runner({loadSpec})
            .span('dashLoad')
            .run(async ctx => {
                ctx.span.setTags({city: selectedCity});

                const params = {city: selectedCity},
                    [currentWeather, forecast] = await Promise.all([
                        XH.fetchJson({url: 'weather/current', params}, ctx),
                        XH.fetchJson({url: 'weather/forecast', params}, ctx)
                    ]);
                if (loadSpec.isStale) return;

                runInAction(() => {
                    this.currentWeather = currentWeather;
                    this.forecast = forecast;
                });
            })
            .catch(e => {
                if (loadSpec.isAutoRefresh || loadSpec.isStale) return;
                XH.handleException(e);
            });
    }
}
