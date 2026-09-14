import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, HSide, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    radioInput,
    RadioInputProps,
    segmentedControl,
    switchInput
} from '@xh/hoist/desktop/cmp/input';
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

const ASSET_CLASSES = [
    'Equity',
    'Fixed Income',
    {label: 'Commodities', value: 'Commodities', disabled: true}
];

const SIDES = ['Buy', 'Sell', {label: 'Short', value: 'Short', disabled: true}];

const ORDER_TYPES = [
    {label: 'Market (MKT)', value: 'mkt'},
    {label: 'Limit (LMT)', value: 'lmt'},
    {label: 'Stop (STP)', value: 'stp'}
];

export const radioInputPanel = hoistCmp.factory({
    displayName: 'RadioInputPanel',
    model: creates(() => RadioInputPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'A set of radio buttons for one choice among a few options, stacked by default or',
                '`inline`. Options are primitives or `{label, value, disabled}` objects, so a',
                'single option can be disabled.',
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
                config: fmtDemoConfig<RadioInputProps>('radioInput', {
                    bind: 'value',
                    inline: model.pgInline || undefined,
                    labelSide: model.pgLabelSide === 'right' ? undefined : model.pgLabelSide,
                    options: raw('ASSET_CLASSES'),
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: radioInput({
                    bind: 'playground',
                    ...ambientProps,
                    inline: model.pgInline,
                    labelSide: model.pgLabelSide,
                    options: ASSET_CLASSES
                })
            }),
            variants: [
                demoRow({
                    label: 'Stacked with a disabled option',
                    info: 'options include {disabled: true}',
                    item: radioInput({bind: 'stacked', ...ambientProps, options: ASSET_CLASSES})
                }),
                demoRow({
                    label: 'Object options',
                    info: '{label, value} objects',
                    item: radioInput({bind: 'orderType', ...ambientProps, options: ORDER_TYPES})
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: radioInput({
                        bind: 'disabledClass',
                        ...ambientProps,
                        disabled: true,
                        options: ASSET_CLASSES
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidSide',
                            label: null,
                            minimal: true,
                            item: radioInput({inline: true, options: SIDES})
                        })
                    })
                })
            ],
            toolbarItems: () => [
                radioInput({
                    bind: 'tbarClass',
                    ...ambientProps,
                    inline: true,
                    options: ASSET_CLASSES
                })
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, required rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'assetClass',
                                item: radioInput({options: ASSET_CLASSES})
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
                                item: radioInput({inline: true, options: SIDES})
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: 'Equity',
    stacked: null,
    orderType: 'lmt',
    disabledClass: 'Fixed Income',
    tbarClass: null
};

class RadioInputPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgInline = false;
    @bindable pgLabelSide: HSide = 'right';

    // Inputs
    @bindable playground: string = SEEDS.playground;
    @bindable stacked: string = SEEDS.stacked;
    @bindable orderType: string = SEEDS.orderType;
    @bindable disabledClass: string = SEEDS.disabledClass;
    @bindable tbarClass: string = SEEDS.tbarClass;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'assetClass',
                displayName: 'Asset class',
                initialValue: 'Equity',
                rules: [required]
            },
            {name: 'side', displayName: 'Side', initialValue: null, rules: [required]},
            {name: 'invalidSide', initialValue: null, rules: [required]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({commitOnChangeDefault: null});
        makeObservable(this);
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
