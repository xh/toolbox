import {createElement, ReactNode} from 'react';
import {HoistModel, lookup, managed} from '@xh/hoist/core';
import {DashCanvasViewModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {WidgetMeta, BindingSpec} from '../dash/types';
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

    /**
     * PanelModel with modal support for the settings dialog.
     * Created only for widgets that declare inputs or config properties.
     */
    @managed panelModel: PanelModel;

    /** True if this widget type has user-configurable settings. */
    get hasSettings(): boolean {
        const meta = (this.constructor as any).meta as WidgetMeta;
        if (!meta) return false;
        return meta.inputs.length > 0 || Object.keys(meta.config).length > 0;
    }

    constructor() {
        super();
        const meta = (this.constructor as any).meta as WidgetMeta;
        const hasSettings = meta && (meta.inputs.length > 0 || Object.keys(meta.config).length > 0);
        if (hasSettings) {
            this.panelModel = new PanelModel({
                modalSupport: {
                    width: '80vw',
                    height: '70vh',
                    canOutsideClickClose: true
                },
                collapsible: false,
                resizable: false
            });
        }
    }

    override onLinked() {
        super.onLinked();
        this.persistWith = {dashViewModel: this.viewModel};

        // Reactively build header items: color indicators + gear button.
        // Tracks canvasModel.viewModels so colors update when widgets are added/removed.
        this.addReaction({
            track: () => {
                const meta = (this.constructor as any).meta as WidgetMeta;
                if (!meta) return null;
                const vmId = this.viewModel.id;
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

        // Gear button for configurable widgets
        if (this.panelModel) {
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
     * Reads the binding from persisted viewState and resolves it
     * through the WiringModel. Returns the input's default value
     * if no binding is defined.
     */
    protected resolveInput<T = any>(inputName: string): T | undefined {
        const viewState = this.viewModel.viewState;

        // 1. Resolve from binding (fromWidget or const)
        const binding: BindingSpec | undefined = viewState?.bindings?.[inputName];
        if (binding) {
            const resolved = this.wiringModel.resolveBinding(binding);
            if (resolved !== undefined) return resolved as T;
        }

        // 2. Fall back to direct state value (e.g. LLM sets {city: "Tokyo"} without a binding)
        const directValue = viewState?.[inputName];
        if (directValue !== undefined) return directValue as T;

        // 3. Fall back to declared default from widget meta
        const meta = (this.constructor as any).meta as WidgetMeta;
        const inputDef = meta?.inputs?.find(i => i.name === inputName);
        return inputDef?.default as T;
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
