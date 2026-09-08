import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, HSide, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {radioInput, segmentedControl, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPlayground,
    demoRow,
    fmtDemoConfig,
    raw,
    wrapperOption
} from '../../../common';
import {inputEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import {inputDemoPage} from './InputDemoPage';

const ENTRY = inputEntry('RadioInput');

const MEALS = ['Steak', 'Chicken', {label: 'Fish', value: 'Fish', disabled: true}];

const SIZES = [
    {label: 'Small (S)', value: 's'},
    {label: 'Medium (M)', value: 'm'},
    {label: 'Large (L)', value: 'l'}
];

export const radioInputPanel = hoistCmp.factory({
    displayName: 'RadioInputPanel',
    model: creates(() => RadioInputPanelModel),

    render({model}) {
        const {disabled} = model;
        return inputDemoPage({
            entry: ENTRY,
            supportsCompact: false,
            supportsCommitOnChange: false,
            description: [
                'A set of radio buttons for one choice among a few options, stacked by default or',
                '`inline`. Options are primitives or `{label, value, disabled}` objects, so a single',
                'option can be disabled.',
                '',
                'Reach for `Select` when the option count grows beyond a handful.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/RadioInputPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/RadioInput.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Inline',
                    propName: 'RadioInputProps.inline',
                    control: switchInput({bind: 'pgInline'})
                }),
                wrapperOption({
                    label: 'Label side',
                    propName: 'RadioInputProps.labelSide',
                    control: segmentedControl({
                        bind: 'pgLabelSide',
                        fill: false,
                        compact: true,
                        options: ['left', 'right']
                    })
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig('radioInput', {
                    bind: 'value',
                    disabled: disabled || undefined,
                    inline: model.pgInline || undefined,
                    labelSide: model.pgLabelSide === 'right' ? undefined : model.pgLabelSide,
                    options: raw('MEALS')
                }),
                item: radioInput({
                    bind: 'playground',
                    disabled,
                    inline: model.pgInline,
                    labelSide: model.pgLabelSide,
                    options: MEALS
                })
            }),
            variants: [
                demoRow({
                    label: 'Stacked with a disabled option',
                    info: 'options include {disabled: true}',
                    item: radioInput({bind: 'stacked', disabled, options: MEALS})
                }),
                demoRow({
                    label: 'Object options',
                    info: '{label, value} objects',
                    item: radioInput({bind: 'size', disabled, options: SIZES})
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: radioInput({bind: 'disabledMeal', disabled: true, options: MEALS})
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidMeal',
                            label: null,
                            minimal: true,
                            item: radioInput({inline: true, options: MEALS})
                        })
                    })
                })
            ],
            toolbarItems: () => [
                radioInput({bind: 'tbarMeal', disabled, inline: true, options: MEALS}),
                toolbarSep(),
                button({text: 'Apply', icon: Icon.filter()})
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, required rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'meal',
                                item: radioInput({options: MEALS})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'side',
                                inline: true,
                                item: radioInput({inline: true, options: MEALS})
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: 'Steak',
    stacked: null,
    size: 'm',
    disabledMeal: 'Chicken',
    tbarMeal: null
};

class RadioInputPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgInline = false;
    @bindable pgLabelSide: HSide = 'right';

    // Specimens
    @bindable playground: string = SEEDS.playground;
    @bindable stacked: string = SEEDS.stacked;
    @bindable size: string = SEEDS.size;
    @bindable disabledMeal: string = SEEDS.disabledMeal;
    @bindable tbarMeal: string = SEEDS.tbarMeal;

    @managed
    override formModel = new FormModel({
        fields: [
            {name: 'meal', displayName: 'Entree', initialValue: 'Steak', rules: [required]},
            {name: 'side', displayName: 'Side', initialValue: null, rules: [required]},
            {name: 'invalidMeal', initialValue: null, rules: [required]}
        ]
    });

    get specimenSeeds() {
        return SEEDS;
    }

    constructor() {
        super();
        makeObservable(this);
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
