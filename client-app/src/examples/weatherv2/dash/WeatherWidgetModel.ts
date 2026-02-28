import {HoistModel, lookup} from '@xh/hoist/core';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {WidgetMeta, BindingSpec} from './types';
import {WiringModel} from './WiringModel';
import {AppModel} from '../AppModel';

/**
 * Abstract base class for all V2 weather dashboard widget models.
 *
 * Provides:
 * - Access to the parent DashViewModel (for persistence).
 * - Input resolution via the WiringModel.
 * - Output publication via the WiringModel.
 *
 * Subclasses must define a static `meta: WidgetMeta` property
 * and register it with the WidgetRegistry.
 */
export abstract class WeatherWidgetModel extends HoistModel {
    /** Static metadata — override in every subclass. */
    static meta: WidgetMeta;

    @lookup(() => DashViewModel)
    viewModel: DashViewModel;

    override onLinked() {
        super.onLinked();
        this.persistWith = {dashViewModel: this.viewModel};
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
        const bindings = this.viewModel.viewState?.bindings;
        const binding: BindingSpec | undefined = bindings?.[inputName];

        if (binding) {
            const resolved = this.wiringModel.resolveBinding(binding);
            if (resolved !== undefined) return resolved as T;
        }

        // Fall back to declared default
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
    private get wiringModel(): WiringModel {
        return AppModel.instance.weatherV2DashModel.wiringModel;
    }
}
