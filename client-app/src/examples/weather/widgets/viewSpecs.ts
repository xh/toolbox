import type {DashCanvasItemState, DashCanvasViewSpec} from '@xh/hoist/desktop/cmp/dash';
import {Icon} from '@xh/hoist/icon';

import {
    calendarDaysIcon,
    cloudRainIcon,
    dropletPercentIcon,
    temperatureIcon,
    windIcon
} from '../Icons';
import {conditionsSummaryWidget} from './ConditionsSummaryWidget';
import {currentConditionsWidget} from './CurrentConditionsWidget';
import {humidityPressureWidget} from './HumidityPressureWidget';
import {precipForecastWidget} from './PrecipForecastWidget';
import {tempForecastWidget} from './TempForecastWidget';
import {windForecastWidget} from './WindForecastWidget';

/**
 * Widget catalog and default layout for the weather dashboard.
 *
 * Held here, apart from `WeatherDashModel`, so that the model does not import the widget
 * components: the widgets look the model up from context, and a model that imported them back
 * would close a runtime import cycle. `AppModel` passes these into the model at construction.
 */
export const viewSpecs: DashCanvasViewSpec[] = [
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
];

export const initialState: DashCanvasItemState[] = [
    {viewSpecId: 'currentConditions', layout: {x: 0, y: 0, w: 4, h: 5}},
    {viewSpecId: 'tempForecast', layout: {x: 4, y: 0, w: 8, h: 5}},
    {viewSpecId: 'precipForecast', layout: {x: 0, y: 5, w: 6, h: 5}},
    {viewSpecId: 'windForecast', layout: {x: 6, y: 5, w: 6, h: 5}},
    {viewSpecId: 'humidityPressure', layout: {x: 0, y: 10, w: 6, h: 5}},
    {viewSpecId: 'conditionsSummary', layout: {x: 6, y: 10, w: 6, h: 5}}
];
