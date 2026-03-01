import {HoistModel, managed} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {DashCanvasModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {Icon} from '@xh/hoist/icon';
import {makeObservable} from '@xh/hoist/mobx';
import {WiringModel} from './WiringModel';
import {widgetRegistry} from './WidgetRegistry';

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
            rowHeight: 30,
            viewSpecs: [
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
            ],
            initialState: [
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
            ]
        });

        // Widget lifecycle: track viewModel additions/removals to cull stale bindings
        // and initialize input defaults. Registered BEFORE auto-title so culled viewState
        // is settled before title computation runs.
        let previousIds = new Set<string>();
        this.addReaction({
            track: () => new Set(this.dashCanvasModel.viewModels.map(vm => vm.id)),
            run: currentIds => {
                // On removal: cull wiring outputs and stale bindings
                for (const id of previousIds) {
                    if (!currentIds.has(id)) {
                        this.wiringModel.removeWidget(id);
                        this.cullBindingsTo(id);
                    }
                }

                // On addition: seed input defaults into viewState
                for (const id of currentIds) {
                    if (!previousIds.has(id)) {
                        this.initInputDefaults(id);
                    }
                }

                previousIds = currentIds;
            },
            fireImmediately: true
        });

        // Auto-title: reactively set titles on display widgets from their bound city.
        // Runs at this level (not in content models) because DashCanvas may lazily render
        // widget content — DashViewModels always exist regardless of render state.
        // Delay avoids setting titles synchronously during the render cycle that fires
        // when a new spec is applied (widget onLinked → publishOutput → this reaction).
        this.addReaction({
            track: () => this.dashCanvasModel.viewModels.map(vm => this.computeAutoTitle(vm)),
            run: titles => {
                this.dashCanvasModel.viewModels.forEach((vm, i) => {
                    if (titles[i] != null) vm.title = titles[i];
                });
            },
            fireImmediately: true,
            delay: 1
        });
    }

    //--------------------------------------------------
    // Widget Lifecycle
    //--------------------------------------------------

    /** Remove bindings that reference a removed widget from all remaining widgets. */
    private cullBindingsTo(removedId: string) {
        for (const vm of this.dashCanvasModel.viewModels) {
            const bindings = vm.viewState?.bindings;
            if (!bindings) continue;

            let changed = false;
            const updated = {...bindings};
            for (const [inputName, binding] of Object.entries(updated)) {
                if (
                    binding &&
                    typeof binding === 'object' &&
                    'fromWidget' in binding &&
                    (binding as any).fromWidget === removedId
                ) {
                    delete updated[inputName];
                    changed = true;
                }
            }

            if (changed) {
                const vs = {...vm.viewState};
                vs.bindings = Object.keys(updated).length > 0 ? updated : undefined;
                vm.setViewState(vs);
            }
        }
    }

    /** Seed declared input defaults into viewState for a newly added widget. */
    private initInputDefaults(widgetId: string) {
        const vm = this.dashCanvasModel.viewModels.find(v => v.id === widgetId);
        if (!vm) return;

        const meta = widgetRegistry.get(vm.viewSpec.id);
        if (!meta) return;

        let changed = false;
        const vs = {...(vm.viewState ?? {})};

        for (const input of meta.inputs) {
            if (input.default === undefined) continue;
            // Only seed if neither a binding nor a manual value already exists
            const hasBinding = vs.bindings?.[input.name] != null;
            const hasManualValue = vs[input.name] !== undefined;
            if (!hasBinding && !hasManualValue) {
                vs[input.name] = input.default;
                changed = true;
            }
        }

        if (changed) vm.setViewState(vs);
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

        // Input widgets: indexed titles when multiple of the same type exist
        const staticTitle = STATIC_WIDGET_TITLES[specId];
        if (staticTitle) {
            const siblings = this.dashCanvasModel.viewModels.filter(v => v.viewSpec.id === specId);
            if (siblings.length > 1) {
                const idx = siblings.findIndex(v => v.id === vm.id) + 1;
                return `${staticTitle} #${idx}`;
            }
            return staticTitle;
        }

        // Display widgets: title = prefix + city (from binding or direct state)
        const titlePrefix = DISPLAY_WIDGET_TITLES[specId];
        if (!titlePrefix) return null;

        const cityBinding = vm.viewState?.bindings?.city;
        const city = cityBinding
            ? this.wiringModel.resolveBinding(cityBinding)
            : vm.viewState?.city;

        return city ? `${titlePrefix} — ${city}` : titlePrefix;
    }
}

/** Input/utility widgets that always get a fixed title. */
const STATIC_WIDGET_TITLES: Record<string, string> = {
    cityChooser: 'City',
    unitsToggle: 'Units'
};

/** Display widgets that get auto-generated titles with city context. */
const DISPLAY_WIDGET_TITLES: Record<string, string> = {
    currentConditions: 'Current Conditions',
    forecastChart: 'Forecast',
    precipChart: 'Precipitation',
    windChart: 'Wind',
    summaryGrid: '5-Day Summary'
};
