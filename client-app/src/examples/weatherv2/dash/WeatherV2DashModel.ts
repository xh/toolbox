import {HoistModel, managed} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {Icon} from '@xh/hoist/icon';
import {makeObservable} from '@xh/hoist/mobx';
import {WiringModel} from './WiringModel';
import {WeatherDataModel} from './WeatherDataModel';

import {temperatureIcon, cloudRainIcon, calendarDaysIcon} from '../Icons';
import {cityChooserWidget} from '../widgets/CityChooserWidget';
import {currentConditionsWidget} from '../widgets/CurrentConditionsWidget';
import {forecastChartWidget} from '../widgets/ForecastChartWidget';
import {precipChartWidget} from '../widgets/PrecipChartWidget';
import {summaryGridWidget} from '../widgets/SummaryGridWidget';

/**
 * Central model for the Weather V2 dashboard.
 *
 * Owns the DashCanvasModel (layout + widgets), the WiringModel (inter-widget
 * communication), and the WeatherDataModel (shared data cache).
 */
export class WeatherV2DashModel extends HoistModel {
    @managed wiringModel: WiringModel;
    @managed weatherDataModel: WeatherDataModel;
    @managed dashCanvasModel: DashCanvasModel;

    viewManagerModel: ViewManagerModel;

    constructor(viewManagerModel: ViewManagerModel) {
        super();
        makeObservable(this);

        this.viewManagerModel = viewManagerModel;
        this.wiringModel = new WiringModel();
        this.weatherDataModel = new WeatherDataModel();

        this.dashCanvasModel = new DashCanvasModel({
            persistWith: {viewManagerModel},
            viewSpecs: [
                {
                    id: 'cityChooser',
                    title: 'City Chooser',
                    icon: Icon.globe(),
                    content: cityChooserWidget,
                    unique: false,
                    width: 3,
                    height: 2
                },
                {
                    id: 'currentConditions',
                    title: 'Current Conditions',
                    icon: Icon.sun(),
                    content: currentConditionsWidget,
                    unique: false,
                    width: 4,
                    height: 5
                },
                {
                    id: 'forecastChart',
                    title: 'Forecast Chart',
                    icon: temperatureIcon(),
                    content: forecastChartWidget,
                    unique: false,
                    width: 8,
                    height: 5
                },
                {
                    id: 'precipChart',
                    title: 'Precipitation',
                    icon: cloudRainIcon(),
                    content: precipChartWidget,
                    unique: false,
                    width: 6,
                    height: 5
                },
                {
                    id: 'summaryGrid',
                    title: '5-Day Summary',
                    icon: calendarDaysIcon(),
                    content: summaryGridWidget,
                    unique: false,
                    width: 6,
                    height: 5
                }
            ],
            initialState: [
                {
                    viewSpecId: 'cityChooser',
                    layout: {x: 0, y: 0, w: 3, h: 2},
                    state: {selectedCity: 'New York'}
                },
                {
                    viewSpecId: 'currentConditions',
                    layout: {x: 3, y: 0, w: 4, h: 5},
                    state: {
                        bindings: {
                            city: {fromWidget: 'cityChooser', output: 'selectedCity'}
                        }
                    }
                },
                {
                    viewSpecId: 'forecastChart',
                    layout: {x: 7, y: 0, w: 5, h: 5},
                    state: {
                        bindings: {
                            city: {fromWidget: 'cityChooser', output: 'selectedCity'}
                        },
                        series: ['temp', 'feelsLike'],
                        chartType: 'line'
                    }
                },
                {
                    viewSpecId: 'precipChart',
                    layout: {x: 0, y: 5, w: 6, h: 5},
                    state: {
                        bindings: {
                            city: {fromWidget: 'cityChooser', output: 'selectedCity'}
                        }
                    }
                },
                {
                    viewSpecId: 'summaryGrid',
                    layout: {x: 6, y: 5, w: 6, h: 5},
                    state: {
                        bindings: {
                            city: {fromWidget: 'cityChooser', output: 'selectedCity'}
                        }
                    }
                }
            ]
        });
    }
}
