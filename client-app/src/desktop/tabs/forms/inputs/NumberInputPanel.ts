import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {numberIs, required} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {numberInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {NumericPrecision} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
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

const ENTRY = inputEntry('NumberInput');

export const numberInputPanel = hoistCmp.factory({
    displayName: 'NumberInputPanel',
    model: creates(() => NumberInputPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps, formFieldProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'Numeric entry that binds a number, never a string. Formats with thousands',
                'separators, accepts shorthand units (1k, 2.5m), applies a scale factor for',
                'percentages, and steps with the arrow keys.',
                '',
                'Right-aligns by default. Size with `width`; the step buttons come from Blueprint.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/NumberInputPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/NumberInput.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Thousands separators',
                    propName: 'NumberInputProps.displayWithCommas',
                    control: switchInput({bind: 'pgCommas'})
                }),
                wrapperOption({
                    label: 'Shorthand units',
                    propName: 'NumberInputProps.enableShorthandUnits',
                    info: 'Type 2k or 1.5m.',
                    control: switchInput({bind: 'pgShorthand'})
                }),
                wrapperOption({
                    label: 'Precision',
                    propName: 'NumberInputProps.precision',
                    control: numberInput({bind: 'pgPrecision', min: 0, max: 4, width: 70})
                }),
                wrapperOption({
                    label: 'Value label',
                    propName: 'NumberInputProps.valueLabel',
                    control: textInput({
                        bind: 'pgValueLabel',
                        placeholder: 'e.g. %',
                        width: 80,
                        commitOnChange: true
                    })
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig('numberInput', {
                    bind: 'value',
                    displayWithCommas: model.pgCommas || undefined,
                    enableShorthandUnits: model.pgShorthand || undefined,
                    precision: model.pgPrecision !== 4 ? model.pgPrecision : undefined,
                    valueLabel: model.pgValueLabel || undefined,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: numberInput({
                    bind: 'playground',
                    ...ambientProps,
                    displayWithCommas: model.pgCommas,
                    enableShorthandUnits: model.pgShorthand,
                    precision: model.pgPrecision as NumericPrecision,
                    valueLabel: model.pgValueLabel || null,
                    width: '100%'
                })
            }),
            variants: [
                demoRow({
                    label: 'Step sizes',
                    info: 'stepSize: 1000, majorStepSize: 100000, minorStepSize: 100',
                    item: numberInput({
                        bind: 'stepSizes',
                        ...ambientProps,
                        stepSize: 1000,
                        majorStepSize: 100000,
                        minorStepSize: 100,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Scale factor',
                    info: "scaleFactor: 100, valueLabel: '%'",
                    item: numberInput({
                        bind: 'percent',
                        ...ambientProps,
                        scaleFactor: 100,
                        valueLabel: '%',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Left icon',
                    info: 'leftIcon: Icon.dollarSign(), displayWithCommas',
                    item: numberInput({
                        bind: 'dollarAmount',
                        ...ambientProps,
                        leftIcon: Icon.dollarSign(),
                        displayWithCommas: true,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Min and max',
                    info: 'min: 0, max: 100',
                    item: numberInput({
                        bind: 'bounded',
                        ...ambientProps,
                        min: 0,
                        max: 100,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true, displayWithCommas',
                    item: numberInput({
                        bind: 'disabledAmount',
                        ...ambientProps,
                        disabled: true,
                        displayWithCommas: true,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidAmount',
                            label: null,
                            minimal: true,
                            ...formFieldProps,
                            item: numberInput()
                        })
                    })
                })
            ],
            toolbarItems: () => [
                numberInput({bind: 'tbarQty', ...ambientProps, placeholder: '####', width: 100}),
                toolbarSep(),
                numberInput({
                    bind: 'tbarAmount',
                    ...ambientProps,
                    displayWithCommas: true,
                    enableShorthandUnits: true,
                    placeholder: 'Amount',
                    width: 140
                }),
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
                                field: 'quantity',
                                ...formFieldProps,
                                item: numberInput({displayWithCommas: true})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'amount',
                                inline: true,
                                ...formFieldProps,
                                item: numberInput()
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: 2_000_000,
    stepSizes: 5000,
    percent: 0.33,
    dollarAmount: 1_250_000,
    bounded: 50,
    disabledAmount: 2_000_000,
    tbarQty: null,
    tbarAmount: null
};

class NumberInputPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgCommas = true;
    @bindable pgShorthand = true;
    @bindable pgPrecision = 0;
    @bindable pgValueLabel = '';

    // Inputs
    @bindable playground: number = SEEDS.playground;
    @bindable stepSizes: number = SEEDS.stepSizes;
    @bindable percent: number = SEEDS.percent;
    @bindable dollarAmount: number = SEEDS.dollarAmount;
    @bindable bounded: number = SEEDS.bounded;
    @bindable disabledAmount: number = SEEDS.disabledAmount;
    @bindable tbarQty: number = SEEDS.tbarQty;
    @bindable tbarAmount: number = SEEDS.tbarAmount;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'quantity',
                displayName: 'Quantity',
                initialValue: 2_000_000,
                rules: [required]
            },
            {
                name: 'amount',
                displayName: 'Amount',
                initialValue: -5,
                rules: [numberIs({min: 0})]
            },
            {name: 'invalidAmount', initialValue: 150, rules: [numberIs({min: 0, max: 100})]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super();
        makeObservable(this);
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
