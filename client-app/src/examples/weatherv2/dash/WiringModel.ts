import {HoistModel} from '@xh/hoist/core';
import {action, makeObservable, observable} from '@xh/hoist/mobx';
import {BindingSpec} from './types';

/**
 * Runtime wiring coordinator for the V2 dashboard.
 *
 * Manages an observable map of widget outputs. Widgets publish outputs here;
 * other widgets resolve their input bindings by reading from this map.
 * MobX reactivity ensures changes propagate automatically.
 */
export class WiringModel extends HoistModel {
    /** Map: widgetInstanceId → {outputName → current value} */
    @observable.ref
    private _outputs = new Map<string, Map<string, any>>();

    constructor() {
        super();
        makeObservable(this);
    }

    /** Publish a named output value from a widget instance. */
    @action
    publishOutput(widgetId: string, outputName: string, value: any) {
        const widgetOutputs = new Map(this._outputs.get(widgetId) ?? new Map());
        widgetOutputs.set(outputName, value);
        const next = new Map(this._outputs);
        next.set(widgetId, widgetOutputs);
        this._outputs = next;
    }

    /** Resolve a binding spec to its current value. */
    resolveBinding(binding: BindingSpec): any {
        if (!binding) return undefined;
        if ('const' in binding) return binding.const;
        if ('fromWidget' in binding) {
            return this._outputs.get(binding.fromWidget)?.get(binding.output);
        }
        return undefined;
    }

    /** Get all current output values for a widget. */
    getOutputs(widgetId: string): Map<string, any> | undefined {
        return this._outputs.get(widgetId);
    }

    /** Get all outputs for all widgets — used by the inspector. */
    get allOutputs(): Map<string, Map<string, any>> {
        return this._outputs;
    }

    /** Remove all outputs for a widget (called on widget removal). */
    @action
    removeWidget(widgetId: string) {
        if (this._outputs.has(widgetId)) {
            const next = new Map(this._outputs);
            next.delete(widgetId);
            this._outputs = next;
        }
    }
}
