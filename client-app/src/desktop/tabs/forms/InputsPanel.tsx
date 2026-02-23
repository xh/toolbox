import {code, div, hframe, p, span, vbox} from '@xh/hoist/cmp/layout';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, lookup} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    buttonGroupInput,
    checkbox,
    dateInput,
    jsonInput,
    numberInput,
    radioInput,
    slider,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtThousands} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
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
                        onClick: () => model.tabContainerModel.activateTab('popoverPicker'),
                        item: 'PopoverPicker'
                    }),
                    ' components.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/InputsPanel.tsx',
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
                maxWidth: 1100,
                scrollable: true,
                item: hframe(column1(), column2(), column3())
            })
        });
    }
});

//------------------------------------------------------------------
// Column 1: Text inputs
//------------------------------------------------------------------
const column1 = hoistCmp.factory<InputsPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
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
                    height: 100,
                    placeholder: 'Tell us your thoughts...',
                    selectOnFocus: true
                })
            }),
            demoRow({
                label: 'JsonInput',
                info: 'enableSearch, showFullscreenButton',
                item: div({
                    style: {border: 'var(--xh-border-solid)'},
                    item: jsonInput({
                        bind: 'jsonInput',
                        height: 180,
                        enableSearch: true
                    })
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 2: Numbers & dates
//------------------------------------------------------------------
const column2 = hoistCmp.factory<InputsPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
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
            }),
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
);

//------------------------------------------------------------------
// Column 3: Toggles & choice
//------------------------------------------------------------------
const column3 = hoistCmp.factory<InputsPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
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
            }),
            demoRow({
                label: 'ButtonGroupInput',
                info: 'Icon + text buttons',
                item: buttonGroupInput({
                    bind: 'buttonGroupInput',
                    items: [
                        button({
                            icon: Icon.chartLine(),
                            text: 'Button 1',
                            value: 'button1'
                        }),
                        button({
                            icon: Icon.gear(),
                            text: 'Button 2',
                            value: 'button2'
                        }),
                        button({
                            icon: Icon.skull(),
                            text: 'Button 3',
                            value: 'button3'
                        })
                    ]
                })
            }),
            demoRow({
                label: 'ButtonGroupInput',
                info: 'outlined, intent: primary',
                item: buttonGroupInput({
                    bind: 'buttonGroupInput2',
                    outlined: true,
                    intent: 'primary',
                    items: [
                        button({
                            icon: Icon.chartLine(),
                            text: 'Button 1',
                            value: 'button1'
                        }),
                        button({
                            icon: Icon.gear(),
                            text: 'Button 2',
                            value: 'button2'
                        }),
                        button({
                            icon: Icon.skull(),
                            text: 'Button 3',
                            value: 'button3'
                        })
                    ]
                })
            }),
            demoRow({
                label: 'RadioInput',
                info: 'inline, disabled option',
                item: radioInput({
                    bind: 'radioInput',
                    inline: true,
                    options: ['Steak', 'Chicken', {label: 'Fish', value: 'Fish', disabled: true}]
                })
            }),
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
    @bindable textInput1: string = null;
    @bindable textInput2: string = `support@xh.io`;
    @bindable textInput3: string = `somethingSuperS3cret!`;
    @bindable textArea: string = null;
    @bindable jsonInput: string = JSON.stringify(
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
    @bindable numberInput1: number = null;
    @bindable numberInput2: number = 2_000_000;
    @bindable numberInput3: number = 0.33;
    @bindable slider1: number = random(0, 100);
    @bindable slider2: number[] = [random(50000, 70000), random(110000, 150000)];
    @bindable dateInput1: Date = null;
    @bindable dateInput2: Date = moment().startOf('hour').toDate();
    @bindable dateInput3: LocalDate = LocalDate.today();

    // Toggles & choice
    @bindable checkbox: boolean = null;
    @bindable switchVal: boolean = null;
    @bindable buttonGroupInput: string = 'button2';
    @bindable buttonGroupInput2: string = 'button2';
    @bindable radioInput: string = null;

    constructor() {
        super();
        makeObservable(this);
    }
}
