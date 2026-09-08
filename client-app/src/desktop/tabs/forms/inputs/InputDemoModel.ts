import {FormModel} from '@xh/hoist/cmp/form';
import {HoistModel, PlainObject} from '@xh/hoist/core';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';
import {DemoConfigValue} from '../../../common';

/** Per-page declaration of which ambient options apply, and how the input behaves by default. */
export interface InputDemoConfig {
    /** True for inputs with a `compact` prop - shows the ambient Compact switch. */
    supportsCompact?: boolean;
    /**
     * The input's own default for `commitOnChange`, or null when it has no such prop. The ambient
     * switch starts in that state and the snippet shows the prop only when it differs.
     */
    commitOnChangeDefault?: boolean | null;
}

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

    /** True for inputs with a `compact` prop - shows the ambient Compact switch. */
    readonly supportsCompact: boolean;

    /**
     * The input's own default for `commitOnChange`, or null when it has no such prop. The ambient
     * switch starts in that state and the snippet shows the prop only when it differs.
     */
    readonly commitOnChangeDefault: boolean | null;

    /** Optional FormModel behind the In a Form section - reset along with the specimens. */
    formModel?: FormModel;

    /** Seed values for every specimen field, keyed by property name. Also applied on reset. */
    abstract get specimenSeeds(): PlainObject;

    constructor({supportsCompact = false, commitOnChangeDefault = false}: InputDemoConfig = {}) {
        super();
        makeObservable(this);

        this.supportsCompact = supportsCompact;
        this.commitOnChangeDefault = commitOnChangeDefault;
        this.commitOnChange = commitOnChangeDefault ?? false;

        // FormField reads `disabled` from its FieldModel, so route the ambient flag through the
        // form.
        this.addReaction({
            track: () => this.disabled,
            run: disabled => {
                if (this.formModel) this.formModel.disabled = disabled;
            }
        });
    }

    /** Props every specimen spreads so the ambient options reach it. */
    get ambientProps(): PlainObject {
        const {disabled, compact, commitOnChange, supportsCompact, commitOnChangeDefault} = this;
        return {
            disabled,
            ...(supportsCompact ? {compact} : {}),
            ...(commitOnChangeDefault != null ? {commitOnChange} : {})
        };
    }

    /** Ambient entries for a Playground snippet - shown only where they differ from the default. */
    get ambientSnippetProps(): Record<string, DemoConfigValue> {
        const {disabled, compact, commitOnChange, supportsCompact, commitOnChangeDefault} = this;
        return {
            disabled: disabled || undefined,
            compact: supportsCompact && compact ? true : undefined,
            commitOnChange:
                commitOnChangeDefault != null && commitOnChange !== commitOnChangeDefault
                    ? commitOnChange
                    : undefined
        };
    }

    /** Props for a `formField` wrapping a specimen - FormField owns its input's commit mode. */
    get formFieldProps(): PlainObject {
        return this.commitOnChangeDefault != null ? {commitOnChange: this.commitOnChange} : {};
    }

    /** Restore every specimen (and the form, if any) to its seeded value. Rail options are kept. */
    @action
    resetSpecimens() {
        Object.assign(this, this.specimenSeeds);
        this.formModel?.reset();
        // Reset clears `validationDisplayed`, so re-run validation to bring the messages back.
        this.formModel?.validateAsync();
    }
}
