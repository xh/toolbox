import {createElement, ReactNode} from 'react';
import {HoistModel, lookup, managed} from '@xh/hoist/core';
import {DashCanvasViewModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {FormModel} from '@xh/hoist/cmp/form';
import {required, numberIs} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {isEqual} from 'lodash';
import {WidgetMeta, BindingSpec, ConfigPropertyDef} from '../dash/types';
import {WiringModel} from '../dash/WiringModel';
import {getInputWidgetColor, getConsumerWidgetColors} from '../dash/colorCoding';
import {AppModel} from '../AppModel';

/**
 * Abstract base class for all V2 weather dashboard widget models.
 *
 * Provides:
 * - Access to the parent DashViewModel (for persistence).
 * - Input resolution via the WiringModel.
 * - Output publication via the WiringModel.
 * - Modal-based settings support for configurable widgets.
 * - Color-coded header indicators for widget linkages.
 *
 * Subclasses must define a static `meta: WidgetMeta` property
 * and register it with the WidgetRegistry.
 */
export abstract class BaseWeatherWidgetModel extends HoistModel {
    /** Static metadata — override in every subclass. */
    static meta: WidgetMeta;

    @lookup(() => DashViewModel)
    viewModel: DashViewModel;

    /** PanelModel with modal support for the settings dialog. */
    @managed panelModel: PanelModel;

    /** FormModel for config property editing in the settings dialog. */
    @managed configFormModel: FormModel;

    /** True if this widget type has user-configurable settings. */
    get hasSettings(): boolean {
        const meta = (this.constructor as any).meta as WidgetMeta;
        if (!meta) return false;
        return meta.inputs.length > 0 || Object.keys(meta.config).length > 0;
    }

    constructor() {
        super();
        const meta = (this.constructor as any).meta as WidgetMeta;

        // Always create PanelModel — every widget has at least the hidePanelHeader config.
        this.panelModel = new PanelModel({
            modalSupport: {
                width: '80vw',
                height: '70vh',
                canOutsideClickClose: true
            },
            collapsible: false,
            resizable: false
        });

        // Always create configFormModel — every widget has at least hidePanelHeader.
        const configEntries = meta ? Object.entries(meta.config) : [];
        this.configFormModel = new FormModel({
            fields: configEntries.map(([key, def]) => configPropertyToField(key, def))
        });
    }

    override onLinked() {
        super.onLinked();
        this.persistWith = {dashViewModel: this.viewModel};

        // Init configFormModel from current viewState and set up bidirectional sync.
        if (this.configFormModel) {
            const meta = (this.constructor as any).meta as WidgetMeta,
                configKeys = Object.keys(meta.config);

            // Init form values from persisted viewState.
            const initialValues: Record<string, any> = {};
            for (const key of configKeys) {
                initialValues[key] = this.viewModel.viewState?.[key] ?? meta.config[key].default;
            }
            this.configFormModel.init(initialValues);

            // Sync form → viewState: push form changes to persisted state.
            this.addReaction({
                track: () => {
                    const vals: Record<string, any> = {};
                    for (const key of configKeys) vals[key] = this.configFormModel.values[key];
                    return vals;
                },
                run: vals => {
                    for (const key of configKeys) {
                        this.viewModel.setViewStateKey(key, vals[key]);
                    }
                }
            });

            // Sync viewState → form: reflect external changes (e.g. LLM updates).
            this.addReaction({
                track: () => {
                    const vs = this.viewModel.viewState ?? {},
                        vals: Record<string, any> = {};
                    for (const key of configKeys) vals[key] = vs[key];
                    return vals;
                },
                run: vals => {
                    const formVals = this.configFormModel.values,
                        updates: Record<string, any> = {};
                    let hasUpdates = false;
                    for (const key of configKeys) {
                        if (!isEqual(vals[key], formVals[key])) {
                            updates[key] = vals[key];
                            hasUpdates = true;
                        }
                    }
                    if (hasUpdates) this.configFormModel.setValues(updates);
                }
            });
        }

        // Reactively build header items: color indicators + gear button.
        // Tracks canvasModel.viewModels so colors update when widgets are added/removed.
        // Also tracks manualEditingEnabled so gear button visibility updates.
        this.addReaction({
            track: () => {
                const meta = (this.constructor as any).meta as WidgetMeta;
                if (!meta) return null;
                const vmId = this.viewModel.id;
                // Track editing toggle to rebuild header items (gear visibility).
                void AppModel.instance.manualEditingEnabled;
                if (meta.category === 'input') return getInputWidgetColor(vmId);
                if (meta.inputs.length > 0) return getConsumerWidgetColors(vmId);
                return null;
            },
            run: () => {
                const canvasVM = this.viewModel as DashCanvasViewModel;
                canvasVM.headerItems = this.buildHeaderItems();
            },
            fireImmediately: true,
            delay: 1
        });

        // Apply colored border to the outer DashCanvas card for input widgets.
        // Tracked separately so it fires when the DOM ref becomes available
        // (after mount) and when the color changes (widgets added/removed).
        this.addReaction({
            track: () => {
                const meta = (this.constructor as any).meta as WidgetMeta;
                if (meta?.category !== 'input') return null;
                const canvasVM = this.viewModel as DashCanvasViewModel;
                const el = canvasVM.ref?.current;
                if (!el) return null;
                return getInputWidgetColor(this.viewModel.id) ?? null;
            },
            run: color => {
                const canvasVM = this.viewModel as DashCanvasViewModel,
                    el = canvasVM.ref?.current as HTMLElement | null;
                if (!el) return;
                if (color) {
                    el.style.border = `2px solid ${color}`;
                    el.style.borderRadius = 'var(--xh-border-radius-px)';
                } else {
                    el.style.border = '';
                    el.style.borderRadius = '';
                }
            },
            fireImmediately: true
        });

        // Sync hidePanelHeader based on viewState config + editing toggle.
        this.addReaction({
            track: () => ({
                editing: AppModel.instance.manualEditingEnabled,
                hide: this.viewModel.viewState?.hidePanelHeader ?? false
            }),
            run: ({editing, hide}) => {
                const canvasVM = this.viewModel as DashCanvasViewModel;
                // While editing, always show header so gear is accessible.
                // When locked, respect the widget's hidePanelHeader setting.
                canvasVM.hidePanelHeader = editing ? false : hide;
            },
            fireImmediately: true
        });
    }

    //--------------------------------------------------
    // Header Items
    //--------------------------------------------------

    /** Build the header items array with color indicators and settings gear button. */
    private buildHeaderItems(): ReactNode[] {
        const meta = (this.constructor as any).meta as WidgetMeta,
            items: ReactNode[] = [];

        if (!meta) return items;

        const vmId = this.viewModel.id;

        // Color dot for input widgets
        if (meta.category === 'input') {
            const color = getInputWidgetColor(vmId);
            if (color) items.push(colorDot(color));
        }

        // Color swatches for consumer widgets showing linked providers
        if (meta.inputs.length > 0) {
            const colors = getConsumerWidgetColors(vmId);
            for (const color of colors) {
                items.push(colorDot(color));
            }
        }

        // Gear button — only visible when manual editing is enabled
        if (this.panelModel && AppModel.instance.manualEditingEnabled) {
            items.push(
                button({
                    icon: Icon.gear(),
                    minimal: true,
                    onClick: () => this.panelModel.toggleIsModal()
                })
            );
        }

        return items;
    }

    //--------------------------------------------------
    // Input Resolution
    //--------------------------------------------------

    /**
     * Resolve a named input to its current value.
     *
     * Fallback chain:
     * 1. Binding (fromWidget or const) → resolved value
     * 2. Direct viewState value (manual / LLM-set)
     * 3. undefined (unbound — widget needs reconfiguration)
     *
     * Input defaults are seeded into viewState at widget-addition time by
     * WeatherV2DashModel, so there is no meta-default fallback here.
     */
    protected resolveInput<T = any>(inputName: string): T | undefined {
        const viewState = this.viewModel.viewState;

        // 1. Resolve from binding (fromWidget or const)
        const binding: BindingSpec | undefined = viewState?.bindings?.[inputName];
        if (binding) {
            const resolved = this.wiringModel.resolveBinding(binding);
            if (resolved !== undefined) return resolved as T;
        }

        // 2. Fall back to direct state value (manual or seeded default)
        const directValue = viewState?.[inputName];
        if (directValue !== undefined) return directValue as T;

        // 3. Unbound — no binding and no manual value
        return undefined;
    }

    //--------------------------------------------------
    // Output Publication
    //--------------------------------------------------

    /** Publish a named output value to the wiring model. */
    protected publishOutput(name: string, value: any) {
        this.wiringModel.publishOutput(this.viewModel.id, name, value);
    }

    //--------------------------------------------------
    // Internal
    //--------------------------------------------------

    /** Access to the shared WiringModel via AppModel singleton. */
    protected get wiringModel(): WiringModel {
        return AppModel.instance.weatherV2DashModel.wiringModel;
    }
}

/** Create a small colored dot element for widget header color coding. */
function colorDot(color: string): ReactNode {
    return createElement('span', {
        className: 'weather-v2-color-dot',
        style: {backgroundColor: color},
        key: `color-${color}`
    });
}

/** Map a ConfigPropertyDef to a FormModel field spec. */
function configPropertyToField(key: string, def: ConfigPropertyDef) {
    const rules = [];
    if (def.required) rules.push(required);
    if (def.type === 'number' && (def.min != null || def.max != null)) {
        rules.push(numberIs({min: def.min, max: def.max}));
    }
    return {name: key, initialValue: def.default ?? null, rules};
}
