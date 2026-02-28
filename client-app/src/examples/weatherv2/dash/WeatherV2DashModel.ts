import {HoistModel, managed} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {DashCanvasModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {Icon} from '@xh/hoist/icon';
import {makeObservable} from '@xh/hoist/mobx';
import {WiringModel} from './WiringModel';

import {temperatureIcon, cloudRainIcon, calendarDaysIcon, windIcon} from '../Icons';
import {cityChooserWidget} from '../widgets/CityChooserWidget';
import {currentConditionsWidget} from '../widgets/CurrentConditionsWidget';
import {forecastChartWidget} from '../widgets/ForecastChartWidget';
import {precipChartWidget} from '../widgets/PrecipChartWidget';
import {summaryGridWidget} from '../widgets/SummaryGridWidget';
import {unitsToggleWidget} from '../widgets/UnitsToggleWidget';
import {windChartWidget} from '../widgets/WindChartWidget';
import {markdownContentWidget} from '../widgets/MarkdownContentWidget';
import {dashInspectorWidget} from '../widgets/DashInspectorWidget';

/**
 * Central model for the Weather V2 dashboard.
 *
 * Owns the DashCanvasModel (layout + widgets) and the WiringModel (inter-widget
 * communication). Weather data is provided by WeatherDataService.
 */
export class WeatherV2DashModel extends HoistModel {
    @managed wiringModel: WiringModel;
    @managed dashCanvasModel: DashCanvasModel;

    viewManagerModel: ViewManagerModel;

    constructor(viewManagerModel: ViewManagerModel) {
        super();
        makeObservable(this);

        this.viewManagerModel = viewManagerModel;
        this.wiringModel = new WiringModel();

        this.dashCanvasModel = new DashCanvasModel({
            persistWith: {viewManagerModel},
            viewSpecs: [
                {
                    id: 'cityChooser',
                    title: 'City Chooser',
                    icon: Icon.globe(),
                    content: cityChooserWidget,
                    unique: false,
                    allowRename: false,
                    width: 3,
                    height: 2
                },
                {
                    id: 'currentConditions',
                    title: 'Current Conditions',
                    icon: Icon.sun(),
                    content: currentConditionsWidget,
                    unique: false,
                    allowRename: false,
                    width: 4,
                    height: 5
                },
                {
                    id: 'forecastChart',
                    title: 'Forecast Chart',
                    icon: temperatureIcon(),
                    content: forecastChartWidget,
                    unique: false,
                    allowRename: false,
                    width: 8,
                    height: 5
                },
                {
                    id: 'precipChart',
                    title: 'Precipitation',
                    icon: cloudRainIcon(),
                    content: precipChartWidget,
                    unique: false,
                    allowRename: false,
                    width: 6,
                    height: 5
                },
                {
                    id: 'summaryGrid',
                    title: '5-Day Summary',
                    icon: calendarDaysIcon(),
                    content: summaryGridWidget,
                    unique: false,
                    allowRename: false,
                    width: 6,
                    height: 5
                },
                {
                    id: 'unitsToggle',
                    title: 'Units Toggle',
                    icon: Icon.gear(),
                    content: unitsToggleWidget,
                    unique: false,
                    allowRename: false,
                    width: 3,
                    height: 2
                },
                {
                    id: 'windChart',
                    title: 'Wind',
                    icon: windIcon(),
                    content: windChartWidget,
                    unique: false,
                    allowRename: false,
                    width: 6,
                    height: 5
                },
                {
                    id: 'markdownContent',
                    title: 'Markdown Content',
                    icon: Icon.info(),
                    content: markdownContentWidget,
                    unique: false,
                    allowRename: false,
                    width: 4,
                    height: 3
                },
                {
                    id: 'dashInspector',
                    title: 'Dash Inspector',
                    icon: Icon.code(),
                    content: dashInspectorWidget,
                    unique: true,
                    allowRename: false,
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
                    viewSpecId: 'unitsToggle',
                    layout: {x: 0, y: 2, w: 3, h: 2},
                    state: {units: 'imperial'}
                },
                {
                    viewSpecId: 'currentConditions',
                    layout: {x: 3, y: 0, w: 4, h: 5},
                    state: {
                        bindings: {
                            city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                            units: {fromWidget: 'unitsToggle_0', output: 'units'}
                        }
                    }
                },
                {
                    viewSpecId: 'forecastChart',
                    layout: {x: 7, y: 0, w: 5, h: 5},
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
                    layout: {x: 0, y: 5, w: 6, h: 5},
                    state: {
                        bindings: {
                            city: {fromWidget: 'cityChooser_0', output: 'selectedCity'}
                        }
                    }
                },
                {
                    viewSpecId: 'windChart',
                    layout: {x: 6, y: 5, w: 6, h: 5},
                    state: {
                        bindings: {
                            city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                            units: {fromWidget: 'unitsToggle_0', output: 'units'}
                        }
                    }
                },
                {
                    viewSpecId: 'summaryGrid',
                    layout: {x: 0, y: 10, w: 12, h: 5},
                    state: {
                        bindings: {
                            city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                            units: {fromWidget: 'unitsToggle_0', output: 'units'}
                        }
                    }
                }
            ]
        });

        // Auto-title: reactively set titles on display widgets from their bound city.
        // Runs at this level (not in content models) because DashCanvas may lazily render
        // widget content — DashViewModels always exist regardless of render state.
        this.addReaction({
            track: () => this.dashCanvasModel.viewModels.map(vm => this.computeAutoTitle(vm)),
            run: titles => {
                this.dashCanvasModel.viewModels.forEach((vm, i) => {
                    if (titles[i] != null) vm.title = titles[i];
                });
            },
            fireImmediately: true
        });
    }

    //--------------------------------------------------
    // Auto-Title
    //--------------------------------------------------

    /** Compute an auto-generated title for a widget, or null to leave as-is. */
    private computeAutoTitle(vm: DashViewModel): string | null {
        const specId = vm.viewSpec.id;

        // Markdown widget: title comes from its persisted state
        if (specId === 'markdownContent') {
            return vm.viewState?.title ?? 'Markdown Content';
        }

        // Display widgets: title = prefix + bound city
        const titlePrefix = DISPLAY_WIDGET_TITLES[specId];
        if (!titlePrefix) return null;

        const cityBinding = vm.viewState?.bindings?.city;
        if (!cityBinding) return titlePrefix;

        const city = this.wiringModel.resolveBinding(cityBinding);
        return city ? `${titlePrefix} — ${city}` : titlePrefix;
    }
}

/** Display widgets that get auto-generated titles with city context. */
const DISPLAY_WIDGET_TITLES: Record<string, string> = {
    currentConditions: 'Current Conditions',
    forecastChart: 'Forecast',
    precipChart: 'Precipitation',
    windChart: 'Wind',
    summaryGrid: '5-Day Summary'
};
