import {FormModel} from '@xh/hoist/cmp/form';
import {HoistModel, PlainObject} from '@xh/hoist/core';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';

/**
 * Base model for a per-input demo page. Holds the ambient options that apply to every specimen on
 * the page and the reset of all specimen values to their seeds. Subclasses add one `@bindable` per
 * live specimen (seeded from `specimenSeeds`) and one per curated Playground prop.
 *
 * Rail option state is per-tab and in-memory, matching the Wrapper rail - not persisted.
 */
export abstract class InputDemoModel extends HoistModel {
    /** Ambient - `compact` on inputs that support it (SegmentedControl, IntentInput, Picker). */
    @bindable compact = false;
    /** Ambient - `disabled` on every specimen. */
    @bindable disabled = false;
    /** Ambient - `commitOnChange` on every specimen that supports it. */
    @bindable commitOnChange = false;

    /** Optional FormModel behind the In a Form section - reset along with the specimens. */
    formModel?: FormModel;

    /** Seed values for every specimen field, keyed by property name. Also applied on reset. */
    abstract get specimenSeeds(): PlainObject;

    constructor() {
        super();
        makeObservable(this);
        // FormField reads `disabled` from its FieldModel, so route the ambient flag through the form.
        this.addReaction({
            track: () => this.disabled,
            run: disabled => {
                if (this.formModel) this.formModel.disabled = disabled;
            }
        });
    }

    /** Props every specimen spreads so the ambient options reach it. */
    get ambientProps() {
        return {disabled: this.disabled, commitOnChange: this.commitOnChange};
    }

    /** Restore every specimen (and the form, if any) to its seeded value. Rail options are kept. */
    @action
    resetSpecimens() {
        Object.assign(this, this.specimenSeeds);
        this.formModel?.reset();
    }
}
