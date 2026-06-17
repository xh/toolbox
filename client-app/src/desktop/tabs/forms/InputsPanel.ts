import {card} from '@xh/hoist/cmp/card';
import {div, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    buttonGroupInput,
    checkbox,
    checkboxButton,
    dateInput,
    jsonInput,
    numberInput,
    radioInput,
    segmentedControl,
    slider,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtThousands} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {random} from 'lodash';
import moment from 'moment';
import {wrapper} from '../../common';
import './InputsPanel.scss';

export const inputsPanel = hoistCmp.factory({
    displayName: 'InputsPanel',
    model: creates(() => InputsPanelModel),

    render() {
        return wrapper({
            title: 'Hoist Inputs',
            icon: Icon.edit(),
            description: [
                '`HoistInput` provides a common interface and integration points for a variety',
                'of core Components used to enter and edit data in applications. They present',
                'a consistent API for editing data with MobX, React, and the underlying',
                'widgets provided by libraries such as Blueprint and Onsen.',
                '',
                'Any HoistInput can be bound to a data source using the `bind` and `model`',
                'props. They can also be nested within a `formField` to integrate tightly with',
                '`FormModel` for validation and labelling.',
                '',
                'See the dedicated tabs for `Select` and `Picker` components.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/InputsPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                },
                {
                    url: '$HR/desktop/cmp/input',
                    text: 'Input package',
                    notes: 'The full set of desktop Hoist input components.'
                }
            ],
            item: panel({
                className: 'tb-inputs-panel',
                width: '100%',
                height: '100%',
                scrollable: true,
                // Both toolbars pinned at the bottom - shows how these inputs render in a dense
                // toolbar. Placed in the bbar so they stay out of scroll.
                bbar: div({
                    items: [inputsTbar({compact: true}), inputsTbar()]
                }),
                // The masonry is the panel's scrolling body directly (no wrapper div). It can't be
                // the overflow element itself - a multi-column container under a constrained height
                // spawns extra horizontal columns instead of scrolling - so the scrollable panel
                // body scrolls it. Cards flow into 1-3 columns by width, balanced by height (SCSS).
                item: div({
                    className: 'tb-inputs-panel__masonry',
                    items: [
                        textCard(),
                        codeCard(),
                        numbersCard(),
                        dateCard(),
                        segmentedControlCard(),
                        buttonGroupCard(),
                        radioCard(),
                        toggleCard(),
                        sliderCard()
                    ]
                })
            })
        });
    }
});

//------------------------------------------------------------------
// Cards - rendered as a flat, ordered set into the masonry above.
//------------------------------------------------------------------
const textCard = hoistCmp.factory(() =>
    card({
        title: 'Text',
        items: [
            demoRow({
                label: 'TextInput',
                info: 'autoFocus',
                item: textInput({
                    bind: 'textInput1',
                    autoFocus: true
                })
            }),
            demoRow({
                label: 'TextInput',
                info: 'placeholder, round, leftIcon, enableClear',
                item: textInput({
                    bind: 'textInput2',
                    placeholder: 'user@company.com',
                    round: true,
                    leftIcon: Icon.mail(),
                    enableClear: true
                })
            }),
            demoRow({
                label: 'TextInput',
                info: 'type: password, selectOnFocus',
                item: textInput({
                    bind: 'textInput3',
                    type: 'password',
                    selectOnFocus: true
                })
            }),
            demoRow({
                label: 'TextArea',
                info: 'placeholder, selectOnFocus',
                item: textArea({
                    bind: 'textArea',
                    placeholder: 'Tell us your thoughts...',
                    selectOnFocus: true,
                    height: 100,
                    width: '100%'
                })
            })
        ]
    })
);

const codeCard = hoistCmp.factory(() =>
    card({
        title: 'JsonInput',
        items: [
            demoRow({
                label: 'enableSearch, showFullscreenButton',
                item: jsonInput({
                    className: 'xh-border',
                    bind: 'jsonInput',
                    height: 180,
                    width: '100%',
                    enableSearch: true
                })
            })
        ]
    })
);

const numbersCard = hoistCmp.factory(() =>
    card({
        title: 'NumberInput',
        items: [
            demoRow({
                label: 'stepSize, majorStepSize, minorStepSize',
                item: numberInput({
                    bind: 'numberInput1',
                    stepSize: 1000,
                    majorStepSize: 100000,
                    minorStepSize: 100
                })
            }),
            demoRow({
                label: 'enableShorthandUnits, displayWithCommas, selectOnFocus',
                item: numberInput({
                    bind: 'numberInput2',
                    enableShorthandUnits: true,
                    displayWithCommas: true,
                    selectOnFocus: true
                })
            }),
            demoRow({
                label: 'scaleFactor, valueLabel',
                item: numberInput({
                    bind: 'numberInput3',
                    scaleFactor: 100,
                    valueLabel: '%'
                })
            })
        ]
    })
);

const dateCard = hoistCmp.factory(() =>
    card({
        title: 'DateInput',
        items: [
            demoRow({
                label: 'minDate, maxDate, enableClear',
                item: dateInput({
                    bind: 'dateInput1',
                    placeholder: 'YYYY-MM-DD',
                    minDate: moment().subtract(5, 'weeks').toDate(),
                    maxDate: moment().add(2, 'weeks').toDate(),
                    enableClear: true,
                    width: 160
                })
            }),
            demoRow({
                label: 'timePrecision: minute',
                item: dateInput({
                    bind: 'dateInput2',
                    showActionsBar: true,
                    timePrecision: 'minute',
                    timePickerProps: {useAmPm: true},
                    width: 160
                })
            }),
            demoRow({
                label: 'valueType: localDate',
                item: dateInput({
                    bind: 'dateInput3',
                    valueType: 'localDate',
                    width: 130
                })
            })
        ]
    })
);

const sliderCard = hoistCmp.factory(() =>
    card({
        title: 'Slider',
        items: [
            demoRow({
                label: 'max, min, stepSize, labelStepSize',
                item: slider({
                    bind: 'slider1',
                    width: '100%',
                    max: 100,
                    min: 0,
                    labelStepSize: 25,
                    stepSize: 1
                })
            }),
            demoRow({
                label: 'multi-value, labelRenderer',
                item: slider({
                    bind: 'slider2',
                    width: '100%',
                    min: 50000,
                    max: 150000,
                    labelStepSize: 50000,
                    stepSize: 1000,
                    labelRenderer: v =>
                        `$${fmtThousands(v, {
                            label: true,
                            precision: 0,
                            labelCls: null,
                            asHtml: true
                        })}`
                })
            })
        ]
    })
);

const segmentedControlCard = hoistCmp.factory(() =>
    card({
        title: 'SegmentedControl',
        items: [
            demoRow({
                label: 'Icon + text options',
                item: segmentedControl({
                    bind: 'segmentedControl',
                    options: scOptions
                })
            }),
            demoRow({
                label: 'Intent: primary',
                item: segmentedControl({
                    bind: 'segmentedControl',
                    intent: 'primary',
                    options: scOptions
                })
            }),
            demoRow({
                label: 'Outlined, intent: primary',
                item: segmentedControl({
                    bind: 'segmentedControl',
                    outlined: true,
                    intent: 'primary',
                    options: scOptions
                })
            }),
            demoRow({
                label: 'Per-option intents - selected fills, unselected hints',
                item: segmentedControl({
                    bind: 'optionIntent',
                    options: [
                        {label: 'Primary', value: 'primary', intent: 'primary'},
                        {label: 'Success', value: 'success', intent: 'success'},
                        {label: 'Warning', value: 'warning', intent: 'warning'},
                        {label: 'Danger', value: 'danger', intent: 'danger'}
                    ]
                })
            })
        ]
    })
);

const buttonGroupCard = hoistCmp.factory(() =>
    card({
        title: 'ButtonGroupInput',
        items: [
            demoRow({
                label: 'Icon + text buttons',
                item: buttonGroupInput({
                    bind: 'buttonGroupInput',
                    items: bgButtons()
                })
            }),
            demoRow({
                label: 'Outlined, intent: primary',
                item: buttonGroupInput({
                    bind: 'buttonGroupInput',
                    outlined: true,
                    intent: 'primary',
                    items: bgButtons()
                })
            })
        ]
    })
);

const radioCard = hoistCmp.factory(() =>
    card({
        title: 'RadioInput',
        items: [
            demoRow({
                label: 'With a disabled option',
                item: radioInput({
                    bind: 'radioInput',
                    options: ['Steak', 'Chicken', {label: 'Fish', value: 'Fish', disabled: true}]
                })
            }),
            demoRow({
                label: 'Inline, with a disabled option',
                item: radioInput({
                    bind: 'radioInput',
                    inline: true,
                    options: ['Steak', 'Chicken', {label: 'Fish', value: 'Fish', disabled: true}]
                })
            })
        ]
    })
);

const toggleCard = hoistCmp.factory(() =>
    card({
        title: 'Toggles',
        items: [
            demoRow({
                label: 'CheckboxButton',
                info: 'Button-based boolean toggle',
                item: checkboxButton({
                    bind: 'checkboxButton',
                    text: 'Enabled'
                })
            }),
            demoRow({
                label: 'Checkbox',
                info: 'Basic boolean toggle',
                item: checkbox({
                    bind: 'checkbox',
                    label: 'enabled'
                })
            }),
            demoRow({
                label: 'SwitchInput',
                info: 'labelSide: left',
                item: switchInput({
                    bind: 'switchVal',
                    label: 'Enabled:',
                    labelSide: 'left'
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Shared option sets
//------------------------------------------------------------------
const bgButtons = () => [
    button({icon: Icon.chartLine(), text: 'Linear', value: 'linear'}),
    button({icon: Icon.chartArea(), text: 'Area', value: 'area'}),
    button({icon: Icon.chartBar(), text: 'Bar', value: 'bar'})
];

const scOptions = [
    {label: 'Trader', value: 'trader', icon: Icon.user()},
    {label: 'Strategy', value: 'strategy', icon: Icon.chessKnight()},
    {label: 'Fund', value: 'fund', icon: Icon.fund()}
];

//------------------------------------------------------------------
// Toolbar with inputs - rendered twice at top (standard + compact) to show how
// these controls render in a dense toolbar.
//------------------------------------------------------------------
const inputsTbar = hoistCmp.factory<InputsPanelModel>(({compact}) =>
    toolbar({
        compact,
        items: [
            textInput({bind: 'tbarText', placeholder: 'Search...', width: 140}),
            '-',
            numberInput({bind: 'tbarNumber', placeholder: '####', width: 80}),
            '-',
            dateInput({bind: 'tbarDate', width: compact ? 110 : 130}),
            '-',
            segmentedControl({
                bind: 'segmentedControl',
                compact,
                fill: false,
                options: scOptions
            }),
            '-',
            buttonGroupInput({
                bind: 'buttonGroupInput',
                items: bgButtons()
            }),
            '-',
            checkboxButton({bind: 'checkboxButton', text: 'Enabled'}),
            '-',
            switchInput({bind: 'tbarSwitch', label: 'Enabled:', labelSide: 'left'})
        ]
    })
);

//------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------
const demoRow = hoistCmp.factory(({label, info, children}) =>
    vbox({
        className: 'tb-inputs-panel__row',
        items: [
            span({className: 'tb-inputs-panel__label', item: label}),
            span({
                omit: !info,
                className: 'xh-text-color-muted xh-font-size-small',
                style: {marginTop: 2},
                item: info
            }),
            div({style: {marginTop: 6}, item: children})
        ]
    })
);

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class InputsPanelModel extends HoistModel {
    // Text inputs
    @bindable accessor textInput1: string = null;
    @bindable accessor textInput2: string = `support@xh.io`;
    @bindable accessor textInput3: string = `somethingSuperS3cret!`;
    @bindable accessor textArea: string = null;
    @bindable accessor jsonInput: string = JSON.stringify(
        {
            name: 'Toolbox',
            version: 4,
            features: ['grids', 'charts', 'forms'],
            config: {theme: 'dark', locale: 'en-US'}
        },
        null,
        2
    );

    // Numbers & dates
    @bindable accessor numberInput1: number = null;
    @bindable accessor numberInput2: number = 2_000_000;
    @bindable accessor numberInput3: number = 0.33;
    @bindable accessor slider1: number = random(0, 100);
    @bindable accessor slider2: number[] = [random(50000, 70000), random(110000, 150000)];
    @bindable accessor dateInput1: Date = null;
    @bindable accessor dateInput2: Date = moment().startOf('hour').toDate();
    @bindable accessor dateInput3: LocalDate = LocalDate.today();

    // Toggles & choice
    @bindable accessor checkbox: boolean = null;
    @bindable accessor switchVal: boolean = null;
    @bindable accessor checkboxButton: boolean = null;
    @bindable accessor buttonGroupInput: string = 'area';
    @bindable accessor segmentedControl: string = 'strategy';
    @bindable accessor optionIntent: string = 'danger';
    @bindable accessor radioInput: string = null;

    // Compact toolbar inputs
    @bindable accessor tbarText: string = null;
    @bindable accessor tbarNumber: number = null;
    @bindable accessor tbarDate: Date = null;
    @bindable accessor tbarSwitch: boolean = false;
}
