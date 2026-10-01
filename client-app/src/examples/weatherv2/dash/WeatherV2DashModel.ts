import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import type {
    DashCanvasItemState,
    DashCanvasViewSpec,
    DashViewModel
} from '@xh/hoist/desktop/cmp/dash';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import type {AppModel} from '../AppModel';
import {WiringModel} from './WiringModel';
import {widgetRegistry} from './WidgetRegistry';

export interface WeatherV2DashConfig {
    viewManagerModel: ViewManagerModel;
    /** Widget catalog - supplied by the app so this model need not import the widgets. */
    viewSpecs: DashCanvasViewSpec[];
    /** Default widget layout, applied when no saved view is selected. */
    initialState: DashCanvasItemState[];
}

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

    constructor({viewManagerModel, viewSpecs, initialState}: WeatherV2DashConfig) {
        super();

        this.viewManagerModel = viewManagerModel;
        this.wiringModel = new WiringModel();

        this.dashCanvasModel = new DashCanvasModel({
            persistWith: {viewManagerModel},
            rowHeight: 30,
            allowsDrop: true,
            viewSpecs,
            initialState
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

        // Lock/unlock canvas editing based on manual editing toggle.
        this.addReaction({
            track: () => (XH.appModel as AppModel).manualEditingEnabled,
            run: enabled => {
                const locked = !enabled;
                this.dashCanvasModel.layoutLocked = locked;
                this.dashCanvasModel.contentLocked = locked;
            },
            fireImmediately: true
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
