import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, Intent, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {intentInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPlayground,
    demoRow,
    fmtDemoConfig,
    wrapperOption
} from '../../../common';
import {inputEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import {inputDemoPage} from './InputDemoPage';

const ENTRY = inputEntry('IntentInput');

export const intentInputPanel = hoistCmp.factory({
    displayName: 'IntentInputPanel',
    model: creates(() => IntentInputPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'A swatch picker for Hoist intents - the value is an `Intent` string. Swatches',
                'carry their intent name as a tooltip and accessible label; `showNames` prints',
                'them too.',
                '',
                'Use `intents` to offer a subset and `enableClear` to allow a null value.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/IntentInputPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/IntentInput.ts', notes: 'Hoist component.'},
                {url: '$HR/core/types/Types.ts', notes: 'The `Intent` type.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Show names',
                    propName: 'IntentInputProps.showNames',
                    control: switchInput({bind: 'pgShowNames'})
                }),
                wrapperOption({
                    label: 'Clear swatch',
                    propName: 'IntentInputProps.enableClear',
                    info: 'Adds an outlined swatch for null.',
                    control: switchInput({bind: 'pgEnableClear'})
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig('intentInput', {
                    bind: 'value',
                    showNames: model.pgShowNames || undefined,
                    enableClear: model.pgEnableClear || undefined,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: intentInput({
                    bind: 'playground',
                    ...ambientProps,
                    showNames: model.pgShowNames,
                    enableClear: model.pgEnableClear
                })
            }),
            variants: [
                demoRow({
                    label: 'Swatches only',
                    info: 'The default',
                    item: intentInput({bind: 'plain', ...ambientProps})
                }),
                demoRow({
                    label: 'Named',
                    info: 'showNames: true',
                    item: intentInput({
                        bind: 'named',
                        ...ambientProps,
                        showNames: true
                    })
                }),
                demoRow({
                    label: 'Subset',
                    info: "intents: ['primary', 'danger']",
                    item: intentInput({
                        bind: 'subset',
                        ...ambientProps,
                        intents: ['primary', 'danger']
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true, showNames: true',
                    item: intentInput({
                        bind: 'disabledIntent',
                        ...ambientProps,
                        disabled: true,
                        showNames: true
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidIntent',
                            label: null,
                            minimal: true,
                            item: intentInput({enableClear: true})
                        })
                    })
                })
            ],
            toolbarItems: compact => [
                intentInput({bind: 'tbarIntent', ...ambientProps, compact}),
                toolbarSep(),
                intentInput({
                    bind: 'tbarIntent',
                    ...ambientProps,
                    compact,
                    showNames: true
                })
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, required rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({field: 'intent', item: intentInput()})
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'badgeIntent',
                                inline: true,
                                item: intentInput({enableClear: true})
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS: Record<string, Intent> = {
    playground: 'primary',
    plain: 'success',
    named: 'warning',
    subset: 'danger',
    disabledIntent: 'primary',
    tbarIntent: null
};

class IntentInputPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgShowNames = false;
    @bindable pgEnableClear = false;

    // Inputs
    @bindable playground: Intent = SEEDS.playground;
    @bindable plain: Intent = SEEDS.plain;
    @bindable named: Intent = SEEDS.named;
    @bindable subset: Intent = SEEDS.subset;
    @bindable disabledIntent: Intent = SEEDS.disabledIntent;
    @bindable tbarIntent: Intent = SEEDS.tbarIntent;

    @managed
    override formModel = new FormModel({
        fields: [
            {name: 'intent', displayName: 'Intent', initialValue: 'primary', rules: [required]},
            {
                name: 'badgeIntent',
                displayName: 'Badge intent',
                initialValue: null,
                rules: [required]
            },
            {name: 'invalidIntent', initialValue: null, rules: [required]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({supportsCompact: true, commitOnChangeDefault: null});
        makeObservable(this);
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
