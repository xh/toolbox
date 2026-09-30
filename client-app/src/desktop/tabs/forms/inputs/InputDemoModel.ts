import type {FormModel} from '@xh/hoist/cmp/form';
import type {PlainObject} from '@xh/hoist/core';
import {HoistModel} from '@xh/hoist/core';
import type {FormFieldProps} from '@xh/hoist/desktop/cmp/form';
import {action, bindable} from '@xh/hoist/mobx';
import type {DemoConfigProps} from '../../../common/Demo';

/**
 * The ambient props spread onto every input on a page. Deliberately not tied to one component's
 * interface, since these pages cover sixteen of them: `disabled` is universal via
 * `HoistInputProps`, while `compact`, `commitOnChange` and `readonly` are spread only where the
 * page declares the input supports them.
 */
export interface AmbientInputProps {
    disabled: boolean;
    compact?: boolean;
    commitOnChange?: boolean;
    readonly?: boolean;
}

/** Per-page declaration of which ambient options apply, and how the input behaves by default. */
export interface InputDemoConfig {
    /** True for inputs with a `compact` prop - shows the ambient Compact switch. */
    supportsCompact?: boolean;
    /**
     * True for inputs with their own `readonly` prop (CodeInput, JsonInput) - the ambient Read-only
     * switch then reaches the inputs directly, not just the In a Form section.
     */
    supportsReadonly?: boolean;
    /**
     * The input's own default for `commitOnChange`, or null when it has no such prop. The ambient
     * switch starts in that state and the snippet shows the prop only when it differs.
     */
    commitOnChangeDefault?: boolean | null;
}

/**
 * Base model for a per-input demo page. Holds the ambient options that apply to every input on
 * the page and the reset of all input values to their seeds. Subclasses add one `@bindable` per
 * live input (seeded from `inputSeeds`) and one per curated Playground prop.
 *
 * Rail option state is per-tab and in-memory, matching the Wrapper rail - not persisted.
 */
export abstract class InputDemoModel extends HoistModel {
    /** Ambient - `compact` on inputs that support it (SegmentedControl, IntentInput, Picker). */
    @bindable accessor compact = false;
    /** Ambient - `disabled` on every input. */
    @bindable accessor disabled = false;
    /**
     * Ambient - `readonly` on the In a Form section's FormModel, and on every input that supports
     * it directly.
     */
    @bindable accessor readonly = false;
    /** Ambient - `commitOnChange` on every input that supports it. */
    @bindable accessor commitOnChange = false;

    /** True for inputs with a `compact` prop - shows the ambient Compact switch. */
    readonly supportsCompact: boolean;

    /** True for inputs with their own `readonly` prop - see {@link InputDemoConfig}. */
    readonly supportsReadonly: boolean;

    /**
     * The input's own default for `commitOnChange`, or null when it has no such prop. The ambient
     * switch starts in that state and the snippet shows the prop only when it differs.
     */
    readonly commitOnChangeDefault: boolean | null;

    /** Optional FormModel behind the In a Form section - reset along with the inputs. */
    formModel?: FormModel;

    /** Seed values for every input field, keyed by property name. Also applied on reset. */
    abstract get inputSeeds(): PlainObject;

    constructor({
        supportsCompact = false,
        supportsReadonly = false,
        commitOnChangeDefault = false
    }: InputDemoConfig = {}) {
        super();

        this.supportsCompact = supportsCompact;
        this.supportsReadonly = supportsReadonly;
        this.commitOnChangeDefault = commitOnChangeDefault;
        this.commitOnChange = commitOnChangeDefault ?? false;

        // FormField reads `disabled` and `readonly` from its FieldModel, so route the ambient
        // flags through the form.
        this.addReaction(
            {
                track: () => this.disabled,
                run: disabled => {
                    if (this.formModel) this.formModel.disabled = disabled;
                }
            },
            {
                track: () => this.readonly,
                run: readonly => {
                    if (this.formModel) this.formModel.readonly = readonly;
                }
            }
        );
    }

    /** Props every input spreads so the ambient options reach it. */
    get ambientProps(): AmbientInputProps {
        const {disabled, compact, commitOnChange, readonly} = this,
            {supportsCompact, supportsReadonly, commitOnChangeDefault} = this;
        return {
            disabled,
            ...(supportsCompact ? {compact} : {}),
            ...(commitOnChangeDefault != null ? {commitOnChange} : {}),
            ...(supportsReadonly ? {readonly} : {})
        };
    }

    /** Ambient entries for a Playground snippet - shown only where they differ from the default. */
    get ambientSnippetProps(): DemoConfigProps<AmbientInputProps> {
        const {disabled, compact, commitOnChange, readonly} = this,
            {supportsCompact, supportsReadonly, commitOnChangeDefault} = this;
        return {
            disabled: disabled || undefined,
            compact: supportsCompact && compact ? true : undefined,
            commitOnChange:
                commitOnChangeDefault != null && commitOnChange !== commitOnChangeDefault
                    ? commitOnChange
                    : undefined,
            readonly: supportsReadonly && readonly ? true : undefined
        };
    }

    /** Props for a `formField` wrapping an input - FormField owns its input's commit mode. */
    get formFieldProps(): Pick<FormFieldProps, 'commitOnChange'> {
        return this.commitOnChangeDefault != null ? {commitOnChange: this.commitOnChange} : {};
    }

    /** Restore every input (and the form, if any) to its seeded value. Rail options are kept. */
    @action
    resetInputs() {
        Object.assign(this, this.inputSeeds);
        this.formModel?.reset();
        // Reset clears `validationDisplayed`, so re-run validation to bring the messages back.
        this.formModel?.validateAsync();
    }
}
