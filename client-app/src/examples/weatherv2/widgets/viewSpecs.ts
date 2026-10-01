import type {DashCanvasItemState, DashCanvasViewSpec} from '@xh/hoist/desktop/cmp/dash';
import {Icon} from '@xh/hoist/icon';

import {calendarDaysIcon, cloudRainIcon, temperatureIcon, windIcon} from '../Icons';
import {cityChooserWidget} from './CityChooserWidget';
import {currentConditionsWidget} from './CurrentConditionsWidget';
import {dashInspectorWidget} from './DashInspectorWidget';
import {forecastChartWidget} from './ForecastChartWidget';
import {markdownContentWidget} from './MarkdownContentWidget';
import {precipChartWidget} from './PrecipChartWidget';
import {summaryGridWidget} from './SummaryGridWidget';
import {unitsToggleWidget} from './UnitsToggleWidget';
import {windChartWidget} from './WindChartWidget';

/**
 * Widget catalog and default layout for the Weather V2 dashboard.
 *
 * Held here, apart from `WeatherV2DashModel`, so that the model does not import the widget
 * components: the widgets reach the model via `XH.appModel` (typed with a type-only import), and a
 * model that imported them back would close a runtime import cycle. `AppModel` passes these into
 * the model at construction.
 *
 * Importing this module also loads every widget module, each of which registers its `meta` with
 * the `widgetRegistry` - so the registry is fully populated before the dashboard is built.
 */
export const viewSpecs: DashCanvasViewSpec[] = [
    {
        id: 'cityChooser',
        title: 'City Chooser',
        icon: Icon.globe(),
        groupName: 'Input',
        content: cityChooserWidget,
        unique: false,
        allowRename: false,
        width: 3,
        height: 3
    },
    {
        id: 'unitsToggle',
        title: 'Units Toggle',
        icon: Icon.gear(),
        groupName: 'Input',
        content: unitsToggleWidget,
        unique: false,
        allowRename: false,
        width: 3,
        height: 3
    },
    {
        id: 'currentConditions',
        title: 'Current Conditions',
        icon: Icon.sun(),
        groupName: 'Display',
        content: currentConditionsWidget,
        unique: false,
        allowRename: false,
        width: 4,
        height: 8
    },
    {
        id: 'forecastChart',
        title: 'Forecast Chart',
        icon: temperatureIcon(),
        groupName: 'Display',
        content: forecastChartWidget,
        unique: false,
        allowRename: false,
        width: 8,
        height: 8
    },
    {
        id: 'precipChart',
        title: 'Precipitation',
        icon: cloudRainIcon(),
        groupName: 'Display',
        content: precipChartWidget,
        unique: false,
        allowRename: false,
        width: 6,
        height: 8
    },
    {
        id: 'summaryGrid',
        title: '5-Day Summary',
        icon: calendarDaysIcon(),
        groupName: 'Display',
        content: summaryGridWidget,
        unique: false,
        allowRename: false,
        width: 6,
        height: 8
    },
    {
        id: 'windChart',
        title: 'Wind',
        icon: windIcon(),
        groupName: 'Display',
        content: windChartWidget,
        unique: false,
        allowRename: false,
        width: 6,
        height: 8
    },
    {
        id: 'markdownContent',
        title: 'Markdown Content',
        icon: Icon.info(),
        groupName: 'Utility',
        content: markdownContentWidget,
        unique: false,
        allowRename: false,
        width: 4,
        height: 5
    },
    {
        id: 'dashInspector',
        title: 'Dash Inspector',
        icon: Icon.code(),
        groupName: 'Utility',
        content: dashInspectorWidget,
        unique: true,
        allowRename: false,
        width: 6,
        height: 8
    }
];

/** Default widget layout, applied when no saved view is selected. */
export const initialState: DashCanvasItemState[] = [
    {
        viewSpecId: 'cityChooser',
        layout: {x: 0, y: 0, w: 3, h: 3},
        state: {selectedCity: 'New York'}
    },
    {
        viewSpecId: 'unitsToggle',
        layout: {x: 0, y: 3, w: 3, h: 3},
        state: {units: 'imperial'}
    },
    {
        viewSpecId: 'currentConditions',
        layout: {x: 3, y: 0, w: 4, h: 8},
        state: {
            bindings: {
                city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                units: {fromWidget: 'unitsToggle_0', output: 'units'}
            }
        }
    },
    {
        viewSpecId: 'forecastChart',
        layout: {x: 7, y: 0, w: 5, h: 8},
        state: {
            bindings: {
                city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                units: {fromWidget: 'unitsToggle_0', output: 'units'}
            },
            series: ['temp', 'feelsLike'],
            chartType: 'line'
        }
    },
    {
        viewSpecId: 'precipChart',
        layout: {x: 0, y: 8, w: 6, h: 8},
        state: {
            bindings: {
                city: {fromWidget: 'cityChooser_0', output: 'selectedCity'}
            }
        }
    },
    {
        viewSpecId: 'windChart',
        layout: {x: 6, y: 8, w: 6, h: 8},
        state: {
            bindings: {
                city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                units: {fromWidget: 'unitsToggle_0', output: 'units'}
            }
        }
    },
    {
        viewSpecId: 'summaryGrid',
        layout: {x: 0, y: 16, w: 12, h: 8},
        state: {
            bindings: {
                city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                units: {fromWidget: 'unitsToggle_0', output: 'units'}
            }
        }
    }
];
