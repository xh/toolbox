import {form, FormModel} from '@xh/hoist/cmp/form';
import {hbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HSide, managed} from '@xh/hoist/core';
import {Constraint} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    checkbox,
    checkboxButton,
    segmentedControl,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
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

const ENTRY = inputEntry('Checkbox');

export const togglesPanel = hoistCmp.factory({
    displayName: 'TogglesPanel',
    model: creates(() => TogglesPanelModel),

    render({model}) {
        const {disabled} = model;
        return inputDemoPage({
            entry: ENTRY,
            title: 'Checkbox & Switch',
            supportsCompact: false,
            supportsCommitOnChange: false,
            description: [
                'Three boolean inputs. `Checkbox` is the standard box with an optional indeterminate',
                'display for null; `SwitchInput` is the same value as a switch; `CheckboxButton` is a',
                'button-shaped toggle sized for toolbars.',
                '',
                'All three bind a boolean and accept a label - on either side for Checkbox and',
                'SwitchInput.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/TogglesPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/Checkbox.ts', notes: 'Checkbox component.'},
                {url: '$HR/desktop/cmp/input/SwitchInput.ts', notes: 'SwitchInput component.'},
                {
                    url: '$HR/desktop/cmp/input/CheckboxButton.ts',
                    notes: 'CheckboxButton component.'
                },
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Label',
                    propName: 'CheckboxProps.label',
                    control: textInput({bind: 'pgLabel', width: 120, commitOnChange: true})
                }),
                wrapperOption({
                    label: 'Label side',
                    propName: 'CheckboxProps.labelSide',
                    info: 'Checkbox and SwitchInput.',
                    control: segmentedControl({
                        bind: 'pgLabelSide',
                        fill: false,
                        compact: true,
                        options: ['left', 'right']
                    })
                }),
                wrapperOption({
                    label: 'Show unset state',
                    propName: 'CheckboxProps.displayUnsetState',
                    info: 'Null renders as indeterminate.',
                    control: switchInput({bind: 'pgUnsetState'})
                })
            ],
            playground: demoPlayground({
                instanceWidth: 420,
                config: [
                    fmtDemoConfig('checkbox', {
                        bind: 'value',
                        label: model.pgLabel || undefined,
                        labelSide: model.pgLabelSide === 'right' ? undefined : model.pgLabelSide,
                        displayUnsetState: model.pgUnsetState || undefined,
                        disabled: disabled || undefined
                    }),
                    fmtDemoConfig('switchInput', {
                        bind: 'value',
                        label: model.pgLabel || undefined,
                        labelSide: model.pgLabelSide === 'right' ? undefined : model.pgLabelSide,
                        disabled: disabled || undefined
                    }),
                    fmtDemoConfig('checkboxButton', {
                        bind: 'value',
                        text: model.pgLabel || undefined,
                        disabled: disabled || undefined
                    })
                ].join('\n\n'),
                item: hbox({
                    gap: 20,
                    alignItems: 'center',
                    items: [
                        checkbox({
                            bind: 'playground',
                            disabled,
                            label: model.pgLabel,
                            labelSide: model.pgLabelSide,
                            displayUnsetState: model.pgUnsetState
                        }),
                        switchInput({
                            bind: 'playground',
                            disabled,
                            label: model.pgLabel,
                            labelSide: model.pgLabelSide
                        }),
                        checkboxButton({
                            bind: 'playground',
                            disabled,
                            text: model.pgLabel
                        })
                    ]
                })
            }),
            variants: [
                demoRow({
                    label: 'Indeterminate',
                    info: 'Checkbox with displayUnsetState and a null value',
                    item: checkbox({
                        bind: 'indeterminate',
                        disabled,
                        displayUnsetState: true
                    })
                }),
                demoRow({
                    label: 'Inline pair',
                    info: 'inline: true',
                    item: hbox({
                        gap: 12,
                        items: [
                            checkbox({bind: 'a', disabled, inline: true, label: 'A'}),
                            checkbox({bind: 'b', disabled, inline: true, label: 'B'})
                        ]
                    })
                }),
                demoRow({
                    label: 'Switch, label left',
                    info: "labelSide: 'left'",
                    item: switchInput({
                        bind: 'switchLeft',
                        disabled,
                        labelSide: 'left',
                        label: 'Enabled'
                    })
                }),
                demoRow({
                    label: 'Custom icons',
                    info: "checkedIcon, uncheckedIcon, iconSide: 'right'",
                    item: checkboxButton({
                        bind: 'customIcons',
                        disabled,
                        checkedIcon: Icon.eye(),
                        uncheckedIcon: Icon.eyeSlash(),
                        iconSide: 'right',
                        text: 'Visible'
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: hbox({
                        gap: 20,
                        alignItems: 'center',
                        items: [
                            checkbox({bind: 'disabledDemo', disabled: true, label: 'Enabled'}),
                            switchInput({bind: 'disabledDemo', disabled: true, label: 'Enabled'}),
                            checkboxButton({bind: 'disabledDemo', disabled: true, text: 'Enabled'})
                        ]
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a rule requiring true',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidTerms',
                            label: null,
                            minimal: true,
                            item: checkbox({label: 'Accept terms'})
                        })
                    })
                })
            ],
            toolbarItems: () => [
                checkboxButton({bind: 'tbarEnabled', disabled, text: 'Enabled'}),
                toolbarSep(),
                checkbox({bind: 'tbarEnabled', disabled, label: 'enabled'}),
                toolbarSep(),
                switchInput({
                    bind: 'tbarEnabled',
                    disabled,
                    label: 'Enabled:',
                    labelSide: 'left'
                }),
                toolbarSep(),
                button({text: 'Apply', icon: Icon.filter()})
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({field: 'notify', item: checkbox()})
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({field: 'terms', inline: true, item: switchInput()})
                        })
                    })
                ]
            })
        });
    }
});

/** Shared rule for the Boolean fields below - fails unless the value is truthy. */
const requireTrue: Constraint = ({value}) => (value ? null : 'You must accept the terms.');

const SEEDS = {
    playground: null,
    indeterminate: null,
    a: true,
    b: false,
    switchLeft: true,
    customIcons: true,
    disabledDemo: true,
    invalidTerms: false,
    tbarEnabled: true
};

class TogglesPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgLabel = 'Enabled';
    @bindable pgLabelSide: HSide = 'right';
    @bindable pgUnsetState = false;

    // Specimens
    @bindable playground: boolean = SEEDS.playground;
    @bindable indeterminate: boolean = SEEDS.indeterminate;
    @bindable a: boolean = SEEDS.a;
    @bindable b: boolean = SEEDS.b;
    @bindable switchLeft: boolean = SEEDS.switchLeft;
    @bindable customIcons: boolean = SEEDS.customIcons;
    @bindable disabledDemo: boolean = SEEDS.disabledDemo;
    @bindable tbarEnabled: boolean = SEEDS.tbarEnabled;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'notify',
                displayName: 'Email notifications',
                initialValue: true,
                rules: [requireTrue]
            },
            {
                name: 'terms',
                displayName: 'Accept terms',
                initialValue: false,
                rules: [requireTrue]
            },
            {name: 'invalidTerms', initialValue: false, rules: [requireTrue]}
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
