import React from 'react';
import {form, FormModel} from '@xh/hoist/cmp/form';
import {box, div, span, strong, filler, frame, hbox, hframe, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
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
import {isString} from 'lodash';
import moment from 'moment';
import {restaurants, usStates} from '../../../core/data';
import {wrapper} from '../../common';
import './InputsPanel.scss';
import {InputsPanelModel} from './InputsPanelModel';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';

export const inputsPanel = hoistCmp.factory({
    model: creates(InputsPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    <code>HoistInput</code>s are core Components used to display editable data in
                    applications. They present a consistent API for editing data with MobX, React,
                    and the underlying widgets provided by libraries such as Blueprint and Onsen. At
                    its simplest, any HoistInput can be bound to a data source using the{' '}
                    <code>bind</code> and <code>model</code> props.
                </p>,
                <p>
                    For more complex uses <code>HoistInput</code>s may also be hosted in{' '}
                    <code>Form</code>s. Forms provide support for validation, data submission, and
                    dirty state management.
                </p>
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
                height: 950,
                item: frame(formContents()),
                bbar: bbar()
            })
        });
    }
});

const formContents = hoistCmp.factory<InputsPanelModel>(({model}) =>
    form({
        fieldDefaults: {
            commitOnChange: model.commitOnChange
        },
        items: hframe(
            vbox({
                className: 'tb-inputs-panel__column',
                items: [
                    row({
                        field: 'textInput1',
                        info: 'autoFocus',
                        item: textInput({
                            autoFocus: true
                        })
                    }),
                    row({
                        field: 'textInput2',
                        info: 'placeholder, leftIcon, enableClear',
                        item: textInput({
                            placeholder: 'user@company.com',
                            round: true,
                            leftIcon: Icon.mail(),
                            enableClear: true
                        })
                    }),
                    row({
                        field: 'textInput3',
                        info: 'type:password, selectOnFocus',
                        readonlyRenderer: v => (v ? v.replace(/./g, '•') : null),
                        item: textInput({
                            type: 'password',
                            selectOnFocus: true
                        })
                    }),
                    row({
                        field: 'textArea',
                        info: 'placeholder, selectOnFocus',
                        layout: {height: 150},
                        item: textArea({
                            placeholder: 'Tell us your thoughts...',
                            selectOnFocus: true
                        })
                    }),
                    row({
                        field: 'jsonInput',
                        layout: {height: 260},
                        item: jsonInput()
                    })
                ]
            }),
            vbox({
                className: 'tb-inputs-panel__column',
                items: [
                    row({
                        field: 'numberInput1',
                        info: 'stepSizes',
                        item: numberInput({
                            stepSize: 1000,
                            majorStepSize: 100000,
                            minorStepSize: 100
                        })
                    }),
                    row({
                        field: 'numberInput2',
                        info: 'enableShorthandUnits, displayWithCommas, selectOnFocus',
                        item: numberInput({
                            enableShorthandUnits: true,
                            displayWithCommas: true,
                            selectOnFocus: true
                        })
                    }),
                    row({
                        field: 'numberInput3',
                        info: 'scale, valueLabel',
                        item: numberInput({
                            scaleFactor: 100,
                            valueLabel: '%'
                        })
                    }),
                    row({
                        field: 'slider1',
                        info: 'max, min, stepSizes',
                        item: slider({
                            max: 100,
                            min: 0,
                            labelStepSize: 25,
                            stepSize: 1
                        })
                    }),
                    row({
                        field: 'slider2',
                        info: 'multi-value, labelRenderer',
                        readonlyRenderer: v =>
                            v.map(it => fmtNumber(it, {asHtml: true})).join(' - '),
                        item: slider({
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
                    }),
                    row({
                        field: 'dateInput1',
                        info: 'minDate, maxDate, enableClear',
                        fmtVal: v => fmtDateTime(v),
                        layout: {width: 160},
                        item: dateInput({
                            placeholder: 'YYYY-MM-DD',
                            minDate: moment().subtract(5, 'weeks').toDate(),
                            maxDate: moment().add(2, 'weeks').toDate(),
                            enableClear: true
                        })
                    }),
                    row({
                        field: 'dateInput2',
                        info: 'timePrecision',
                        fmtVal: v => fmtDateTime(v),
                        readonlyRenderer: v => fmtDateTime(v),
                        layout: {width: 160},
                        item: dateInput({
                            showActionsBar: true,
                            timePrecision: 'minute',
                            timePickerProps: {useAmPm: true}
                        })
                    }),
                    row({
                        field: 'dateInput3',
                        info: 'valueType: localDate',
                        layout: {width: 130},
                        item: dateInput({
                            valueType: 'localDate'
                        })
                    })
                ]
            }),
            vbox({
                className: 'tb-inputs-panel__column',
                items: [
                    row({
                        field: 'select1',
                        info: 'enableClear, enableCreate, selectOnFocus',
                        item: select({
                            options: restaurants,
                            enableClear: true,
                            enableCreate: true,
                            selectOnFocus: true,
                            placeholder: 'Search restaurants...'
                        })
                    }),
                    row({
                        field: 'select2',
                        info: 'enableFilter:false',
                        layout: {width: 150},
                        item: select({
                            options: usStates,
                            enableFilter: false,
                            placeholder: 'Select a state...'
                        })
                    }),
                    row({
                        field: 'select3',
                        info: 'custom fields, renderer, selectOnFocus, async search',
                        item: select({
                            valueField: 'id',
                            labelField: 'company',
                            enableClear: true,
                            selectOnFocus: true,
                            queryFn: q => model.queryCustomersAsync(q),
                            optionRenderer: opt => customerOption({opt}),
                            placeholder: 'Search customers...'
                        })
                    }),
                    row({
                        field: 'select4',
                        info: 'enableMulti, leftIcon',
                        item: select({
                            options: usStates,
                            enableClear: false,
                            enableMulti: true,
                            leftIcon: Icon.globe(),
                            placeholder: 'Select state(s)...'
                        })
                    }),
                    row({
                        field: 'checkbox',
                        item: checkbox({
                            label: 'enabled'
                        })
                    }),
                    row({
                        field: 'switch',
                        item: switchInput({
                            label: 'Enabled:',
                            labelSide: 'left'
                        })
                    }),
                    row({
                        field: 'buttonGroupInput',
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
                        field: 'radioInput',
                        info: 'inline, disabled option',
                        item: radioInput({
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
        )
    })
);

const row = hoistCmp.factory<FormModel>({
    model: uses(FormModel),

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

const customerOption = hoistCmp.factory(({opt}) =>
    hbox({
        className: 'xh-pad-half xh-border-bottom',
        items: [
            box({
                item: opt.isActive
                    ? Icon.checkCircle({className: 'xh-green'})
                    : Icon.x({className: 'xh-red'}),
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

const bbar = hoistCmp.factory<InputsPanelModel>(({model}) => {
    const {formModel} = model;

    return toolbar(
        currFocused(),
        filler(),
        setFocusMenu(),
        toolbarSep(),
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
});

const fieldDisplay = hoistCmp.factory(({fieldModel, fmtVal}) => {
    let displayVal = fieldModel.value;
    if (displayVal == null) {
        displayVal = 'null';
    } else {
        displayVal = fmtVal ? fmtVal(displayVal) : displayVal.toString();
        if (isString(displayVal) && displayVal.trim() === '') {
            displayVal = displayVal.length ? '[Blank String]' : '[Empty String]';
        }
    }
    return div({
        className: 'inputs-panel-field-display',
        item: displayVal
    });
});

const currFocused = hoistCmp.factory<InputsPanelModel>(({model}) => {
    const {focusedField} = model.formModel;
    return span('Focused: ', focusedField ? strong(focusedField.displayName) : '');
});

const setFocusMenu = hoistCmp.factory<InputsPanelModel>(({model}) => {
    const fields = model.formModel.fieldList,
        menuItems = fields.map(f => {
            return menuItem({text: f.displayName, onClick: () => f.focus()});
        });
    return popover({
        item: button({
            icon: Icon.target(),
            text: 'Set Focus'
        }),
        content: menu(menuItems)
    });
});
