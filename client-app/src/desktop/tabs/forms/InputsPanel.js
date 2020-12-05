import React from 'react';
import {form, FormModel} from '@xh/hoist/cmp/form';
import {box, div, filler, frame, hbox, hframe, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import {button, buttonGroup} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    buttonGroupInput,
    checkbox,
    dateInput,
    jsonInput,
    numberInput,
    radioInput,
    select,
    slider,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtDateTime, fmtNumber, fmtThousands} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import moment from 'moment';
import {restaurants, usStates} from '../../../core/data';
import {wrapper} from '../../common';
import './InputsPanel.scss';
import {InputsPanelModel} from './InputsPanelModel';

export const inputsPanel = hoistCmp.factory({
    model: creates(InputsPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    <code>HoistInput</code>s are core Components used to display editable data in applications.
                    They present a consistent API for editing data with MobX, React, and the underlying widgets
                    provided by libraries such as Blueprint and Onsen. At its simplest, any HoistInput can be bound to a
                    data source using the <code>bind</code> and <code>model</code> props.
                </p>,
                <p>
                    For more complex uses <code>HoistInput</code>s may also be hosted in <code>Form</code>s. Forms
                    provide
                    support for validation, data submission, and dirty state management.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/forms/InputsPanel.js', notes: 'This example.'},
                {url: '$HR/cmp/input/HoistInput.js', notes: 'HoistInput Base Class'},
                {url: '$HR/desktop/cmp/input', notes: 'Hoist Inputs'}
            ],
            item: panel({
                title: 'Forms › HoistInputs',
                className: 'toolbox-inputs-panel',
                icon: Icon.edit(),
                width: '90%',
                height: 850,
                item: frame(formContents()),
                bbar: bbar()
            })
        });
    }
});


const formContents = hoistCmp.factory(
    ({model}) => form({
        fieldDefaults: {
            commitOnChange: model.commitOnChange
        },
        items: hframe(
            vbox({
                className: 'toolbox-inputs-panel__column',
                items: [
                    row({
                        label: 'TextInput',
                        field: 'text1',
                        info: 'autoFocus',
                        item: textInput({
                            ref: model.fieldRefsObj.text1,
                            autoFocus: true
                        })
                    }),
                    row({
                        label: 'TextInput',
                        field: 'text2',
                        info: 'placeholder, leftIcon, enableClear',
                        item: textInput({
                            placeholder: 'user@company.com',
                            round: true,
                            ref: model.fieldRefsObj.text2,
                            leftIcon: Icon.mail(),
                            enableClear: true
                        })
                    }),
                    row({
                        label: 'TextInput',
                        field: 'text3',
                        info: 'type:password, selectOnFocus',
                        readonlyRenderer: v => v ? v.replace(/./g, '•') : null,
                        item: textInput({
                            type: 'password',
                            ref: model.fieldRefsObj.text3,
                            selectOnFocus: true
                        })
                    }),
                    row({
                        label: 'TextArea',
                        field: 'text4',
                        info: 'fill, placeholder, selectOnFocus',
                        layout: {height: 150},
                        item: textArea({
                            fill: true,
                            placeholder: 'Tell us your thoughts...',
                            ref: model.fieldRefsObj.text4,
                            selectOnFocus: true
                        })
                    }),
                    row({
                        label: 'JSONInput',
                        field: 'text5',
                        layout: {height: 200},
                        item: jsonInput({
                            ref: model.fieldRefsObj.text5
                        })
                    })
                ]
            }),
            vbox({
                className: 'toolbox-inputs-panel__column',
                items: [
                    row({
                        label: 'NumberInput',
                        field: 'number1',
                        info: 'stepSizes',
                        item: numberInput({
                            fill: true,
                            stepSize: 1000,
                            majorStepSize: 100000,
                            minorStepSize: 100,
                            ref: model.fieldRefsObj.number1
                        })
                    }),
                    row({
                        label: 'NumberInput',
                        field: 'number2',
                        info: 'enableShorthandUnits, displayWithCommas, selectOnFocus',
                        item: numberInput({
                            fill: true,
                            enableShorthandUnits: true,
                            displayWithCommas: true,
                            selectOnFocus: true,
                            ref: model.fieldRefsObj.number2
                        })
                    }),
                    row({
                        label: 'Slider',
                        field: 'range1',
                        info: 'max, min, stepSizes',
                        item: slider({
                            max: 100,
                            min: 0,
                            labelStepSize: 25,
                            stepSize: 1,
                            ref: model.fieldRefsObj.range1
                        })
                    }),
                    row({
                        label: 'Slider',
                        field: 'range2',
                        info: 'multi-value, labelRenderer',
                        readonlyRenderer: v => v.map(it => fmtNumber(it)).join(' - '),
                        item: slider({
                            min: 50000,
                            max: 150000,
                            labelStepSize: 25000,
                            stepSize: 1000,
                            labelRenderer: v => `$${fmtThousands(v, {
                                label: true,
                                precision: 0,
                                labelCls: null
                            })}`,
                            ref: model.fieldRefsObj.range2
                        })
                    }),
                    row({
                        label: 'DateInput',
                        field: 'date1',
                        info: 'minDate, maxDate, enableClear',
                        fmtVal: v => fmtDateTime(v),
                        layout: {width: 160},
                        item: dateInput({
                            placeholder: 'YYYY-MM-DD',
                            minDate: moment().subtract(5, 'weeks').toDate(),
                            maxDate: moment().add(2, 'weeks').toDate(),
                            enableClear: true,
                            ref: model.fieldRefsObj.date1
                        })
                    }),
                    row({
                        label: 'DateInput',
                        field: 'date2',
                        info: 'timePrecision',
                        fmtVal: v => fmtDateTime(v),
                        readonlyRenderer: v => fmtDateTime(v),
                        layout: {width: 160},
                        item: dateInput({
                            showActionsBar: true,
                            timePrecision: 'minute',
                            timePickerProps: {useAmPm: true},
                            ref: model.fieldRefsObj.date2
                        })
                    }),
                    row({
                        label: 'DateInput',
                        field: 'localDate',
                        info: 'valueType: localDate',
                        layout: {width: 130},
                        item: dateInput({
                            valueType: 'localDate',
                            ref: model.fieldRefsObj.localDate
                        })
                    })
                ]
            }),
            vbox({
                className: 'toolbox-inputs-panel__column',
                items: [
                    row({
                        label: 'Select',
                        field: 'option1',
                        info: 'enableClear, enableCreate, selectOnFocus',
                        item: select({
                            options: restaurants,
                            enableClear: true,
                            enableCreate: true,
                            selectOnFocus: true,
                            placeholder: 'Search restaurants...',
                            ref: model.fieldRefsObj.option1
                        })
                    }),
                    row({
                        label: 'Select',
                        field: 'option2',
                        info: 'enableFilter:false',
                        layout: {width: 150},
                        item: select({
                            options: usStates,
                            enableFilter: false,
                            placeholder: 'Select a state...',
                            ref: model.fieldRefsObj.option2
                        })
                    }),
                    row({
                        label: 'Select',
                        field: 'option3',
                        info: 'custom fields, renderer, selectOnFocus, async search',
                        item: select({
                            valueField: 'id',
                            labelField: 'company',
                            enableClear: true,
                            selectOnFocus: true,
                            queryFn: (q) => model.queryCustomersAsync(q),
                            optionRenderer: (opt) => customerOption({opt}),
                            placeholder: 'Search customers...',
                            ref: model.fieldRefsObj.option3
                        })
                    }),
                    row({
                        label: 'Select',
                        field: 'option5',
                        info: 'enableMulti',
                        item: select({
                            options: usStates,
                            enableClear: false,
                            enableMulti: true,
                            placeholder: 'Select state(s)...',
                            ref: model.fieldRefsObj.option5
                        })
                    }),
                    row({
                        label: 'Checkbox',
                        field: 'bool1',
                        item: checkbox({
                            label: 'enabled',
                            ref: model.fieldRefsObj.bool1
                        })
                    }),
                    row({
                        label: 'SwitchInput',
                        field: 'bool2',
                        item: switchInput({
                            label: 'Enabled:',
                            labelAlign: 'left',
                            ref: model.fieldRefsObj.bool2
                        })
                    }),
                    row({
                        label: 'ButtonGroupInput',
                        field: 'buttonGroup1',
                        item: buttonGroupInput(
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
                        )
                    }),
                    row({
                        label: 'RadioInput',
                        field: 'option6',
                        info: 'inline, disabled option',
                        item: radioInput({
                            inline: true,
                            options: ['Steak', 'Chicken', {label: 'Fish', value: 'Fish', disabled: true}]
                        })
                    })
                ]
            })
        )
    })
);

const row = hoistCmp.factory({
    model: uses(FormModel),
    memo: false,

    render({model, label, field, info, readonlyRenderer, fmtVal, layout = {}, children}) {
        const fieldModel = model.fields[field];

        if (!layout.width) layout.flex = 1;

        return box({
            className: 'inputs-panel-field-box',
            items: [
                fieldDisplay({fieldModel, fmtVal}),
                formField({
                    model: fieldModel,
                    item: children,
                    label,
                    info,
                    readonlyRenderer,
                    ...layout
                })
            ]
        });
    }
});

const customerOption = hoistCmp.factory(
    ({opt}) => hbox({
        className: 'xh-pad-half xh-border-bottom',
        items: [
            box({
                item: opt.isActive ?
                    Icon.checkCircle({className: 'xh-green'}) :
                    Icon.x({className: 'xh-red'}),
                width: 32,
                justifyContent: 'center'
            }),
            div(
                opt.company,
                div({
                    className: 'xh-text-color-muted xh-font-size-small',
                    item: `${opt.city} · ID: ${opt.id}`
                })
            )
        ],
        alignItems: 'center',
        paddingLeft: 0
    })
);

const bbar = hoistCmp.factory(
    ({model}) => {
        const {formModel} = model;

        return toolbar(
            buttonGroup(
                button({
                    text: 'Previous',
                    icon: Icon.angleLeft(),
                    minimal: false,
                    width: 130,
                    onClick: () => model.focus(-1)
                }),
                button({
                    text: 'Next',
                    rightIcon: Icon.angleRight(),
                    minimal: false,
                    width: 130,
                    onClick: () => model.focus(1)
                })
            ),
            filler(),
            switchInput({
                model: formModel,
                bind: 'readonly',
                label: 'Read-only'
            }),
            toolbarSep(),
            switchInput({
                model: formModel,
                bind: 'disabled',
                label: 'Disabled'
            }),
            toolbarSep(),
            switchInput({
                model,
                bind: 'commitOnChange',
                label: 'Commit on change'
            })
        );
    }
);

const fieldDisplay = hoistCmp.factory(
    ({fieldModel, fmtVal}) => {
        let displayVal = fieldModel.value;
        if (displayVal == null) {
            displayVal = 'null';
        } else {
            displayVal = fmtVal ? fmtVal(displayVal) : displayVal.toString();
            if (displayVal.trim() === '') {
                displayVal = displayVal.length ? '[Blank String]' : '[Empty String]';
            }
        }
        return div({
            className: 'inputs-panel-field-display',
            item: displayVal
        });
    }
);
