import {card} from '@xh/hoist/cmp/card';
import {code, div, hframe, p, span, vbox} from '@xh/hoist/cmp/layout';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, lookup} from '@xh/hoist/core';
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

    render({model}) {
        return wrapper({
            description: [
                p(
                    code('HoistInput'),
                    ' provides a common interface and integration points for a variety of core Components used to enter and edit data in applications. They present a consistent API for editing data with MobX, React, and the underlying widgets provided by libraries such as Blueprint and Onsen.'
                ),
                p(
                    'Any HoistInput can be bound to a data source using the ',
                    code('bind'),
                    ' and ',
                    code('model'),
                    ' props. They can also be nested within a ',
                    code('formField'),
                    ' to integrate tightly with ',
                    code('FormModel'),
                    ' for validation and labelling.'
                ),
                p(
                    'See the dedicated tabs for ',
                    code({
                        className: 'tb-code-link',
                        onClick: () => model.tabContainerModel.activateTab('select'),
                        item: 'Select'
                    }),
                    ' and ',
                    code({
                        className: 'tb-code-link',
                        onClick: () => model.tabContainerModel.activateTab('picker'),
                        item: 'Picker'
                    }),
                    ' components.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/InputsPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/input/HoistInputModel.ts', notes: 'HoistInput Base Class'},
                {url: '$HR/desktop/cmp/input', notes: 'Hoist Inputs'}
            ],
            item: panel({
                title: 'Forms › HoistInputs',
                className: 'tb-inputs-panel',
                icon: Icon.edit(),
                width: '90%',
                maxWidth: 1400,
                scrollable: true,
                tbar: inputsTbar({compact: false}),
                item: hframe({
                    gap: true,
                    padding: true,
                    items: [column1(), column2(), column3(), column4()]
                }),
                bbar: inputsTbar({compact: true})
            })
        });
    }
});

const column1 = hoistCmp.factory<InputsPanelModel>(() =>
    vbox({
        flex: 1,
        items: [
            card({
                title: 'Text',
                icon: Icon.edit(),
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
            }),
            card({
                title: 'Code',
                icon: Icon.json(),
                items: [
                    demoRow({
                        label: 'JsonInput',
                        info: 'enableSearch, showFullscreenButton',
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
        ]
    })
);

const column2 = hoistCmp.factory<InputsPanelModel>(() =>
    vbox({
        flex: 1,
        items: [
            card({
                title: 'Numbers',
                icon: Icon.calculator(),
                items: [
                    demoRow({
                        label: 'NumberInput',
                        info: 'stepSize, majorStepSize, minorStepSize',
                        item: numberInput({
                            bind: 'numberInput1',
                            stepSize: 1000,
                            majorStepSize: 100000,
                            minorStepSize: 100
                        })
                    }),
                    demoRow({
                        label: 'NumberInput',
                        info: 'enableShorthandUnits, displayWithCommas, selectOnFocus',
                        item: numberInput({
                            bind: 'numberInput2',
                            enableShorthandUnits: true,
                            displayWithCommas: true,
                            selectOnFocus: true
                        })
                    }),
                    demoRow({
                        label: 'NumberInput',
                        info: 'scaleFactor, valueLabel',
                        item: numberInput({
                            bind: 'numberInput3',
                            scaleFactor: 100,
                            valueLabel: '%'
                        })
                    })
                ]
            }),
            card({
                title: 'Date Inputs',
                icon: Icon.calendar(),
                items: [
                    demoRow({
                        label: 'DateInput',
                        info: 'minDate, maxDate, enableClear',
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
                        label: 'DateInput',
                        info: 'timePrecision: minute',
                        item: dateInput({
                            bind: 'dateInput2',
                            showActionsBar: true,
                            timePrecision: 'minute',
                            timePickerProps: {useAmPm: true},
                            width: 160
                        })
                    }),
                    demoRow({
                        label: 'DateInput',
                        info: 'valueType: localDate',
                        item: dateInput({
                            bind: 'dateInput3',
                            valueType: 'localDate',
                            width: 130
                        })
                    })
                ]
            })
        ]
    })
);

const column3 = hoistCmp.factory<InputsPanelModel>(() =>
    vbox({
        flex: 1,
        items: [
            card({
                title: 'Multiple Choice',
                icon: Icon.list(),
                items: [
                    demoRow({
                        label: 'SegmentedControl',
                        info: 'icon + text options',
                        item: segmentedControl({
                            bind: 'segmentedControl',
                            options: scOptions
                        })
                    }),
                    demoRow({
                        label: 'SegmentedControl',
                        info: 'intent: primary, icon + text options',
                        item: segmentedControl({
                            bind: 'segmentedControl',
                            intent: 'primary',
                            options: scOptions
                        })
                    }),
                    demoRow({
                        label: 'SegmentedControl',
                        info: 'outlined, intent: primary',
                        item: segmentedControl({
                            bind: 'segmentedControl',
                            outlined: true,
                            intent: 'primary',
                            options: scOptions
                        })
                    }),
                    demoRow({
                        label: 'ButtonGroupInput',
                        info: 'Icon + text buttons',
                        item: buttonGroupInput({
                            bind: 'buttonGroupInput',
                            items: bgButtons()
                        })
                    }),
                    demoRow({
                        label: 'ButtonGroupInput',
                        info: 'outlined, intent: primary',
                        item: buttonGroupInput({
                            bind: 'buttonGroupInput',
                            outlined: true,
                            intent: 'primary',
                            items: bgButtons()
                        })
                    }),
                    demoRow({
                        label: 'RadioInput',
                        info: 'disabled option',
                        item: radioInput({
                            bind: 'radioInput',
                            options: [
                                'Steak',
                                'Chicken',
                                {label: 'Fish', value: 'Fish', disabled: true}
                            ]
                        })
                    }),
                    demoRow({
                        label: 'RadioInput',
                        info: 'inline, disabled option',
                        item: radioInput({
                            bind: 'radioInput',
                            inline: true,
                            options: [
                                'Steak',
                                'Chicken',
                                {label: 'Fish', value: 'Fish', disabled: true}
                            ]
                        })
                    })
                ]
            })
        ]
    })
);

const column4 = hoistCmp.factory<InputsPanelModel>(() =>
    vbox({
        flex: 1,
        items: [
            card({
                title: 'Toggles',
                icon: Icon.checkSquare(),
                items: [
                    demoRow({
                        label: 'CheckboxButton',
                        info: 'Button-based boolean toggle',
                        item: checkboxButton({
                            bind: 'checkboxButton',
                            text: 'Active'
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
            }),
            card({
                title: 'Sliders',
                icon: Icon.settings(),
                items: [
                    demoRow({
                        label: 'Slider',
                        info: 'max, min, stepSize, labelStepSize',
                        item: slider({
                            bind: 'slider1',
                            max: 100,
                            min: 0,
                            labelStepSize: 25,
                            stepSize: 1
                        })
                    }),
                    demoRow({
                        label: 'Slider',
                        info: 'multi-value, labelRenderer',
                        item: slider({
                            bind: 'slider2',
                            min: 50000,
                            max: 150000,
                            labelStepSize: 25000,
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
// Toolbar with inputs - used as both tbar (standard) and bbar (compact)
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
    @lookup(TabContainerModel) tabContainerModel: TabContainerModel;

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
    @bindable accessor radioInput: string = null;

    // Compact toolbar inputs
    @bindable accessor tbarText: string = null;
    @bindable accessor tbarNumber: number = null;
    @bindable accessor tbarDate: Date = null;
    @bindable accessor tbarSwitch: boolean = false;
}
