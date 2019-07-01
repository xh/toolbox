/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH, elemFactory} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {frame, hframe, hbox, vbox, div, box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import moment from 'moment';
import {fmtDateTime, fmtThousands, fmtNumber} from '@xh/hoist/format';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    checkbox,
    dateInput,
    textInput,
    textArea,
    numberInput,
    radioInput,
    slider,
    select,
    switchInput,
    jsonInput,
    buttonGroupInput
} from '@xh/hoist/desktop/cmp/input';

import {usStates, restaurants} from '../../../core/data';
import {wrapper} from '../../common';
import {ControlsPanelModel} from './ControlsPanelModel';
import './ControlsPanel.scss';

@HoistComponent
export class ControlsPanel extends Component {

    model = new ControlsPanelModel();

    render() {
        return wrapper(
            panel({
                title: 'Forms › Controls',
                className: 'toolbox-controls-panel',
                icon: Icon.edit(),
                width: '90%',
                height: '90%',
                item: this.renderForm(),
                bbar: this.renderToolbar()
            })
        );
    }

    renderForm() {
        const {model, row} = this,
            {formModel, commitOnChange} = model;

        return frame({
            item: form({
                model: formModel,
                fieldDefaults: {
                    commitOnChange
                },
                items: hframe(
                    vbox({
                        className: 'toolbox-controls-panel__column',
                        items: [
                            row({
                                label: 'TextInput',
                                field: 'text1',
                                info: 'autoFocus',
                                item: textInput({
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
                                    selectOnFocus: true
                                })
                            }),
                            row({
                                label: 'JSONInput',
                                field: 'text5',
                                layout: {height: 200},
                                item: jsonInput()
                            })
                        ]
                    }),
                    vbox({
                        className: 'toolbox-controls-panel__column',
                        items: [
                            row({
                                label: 'NumberInput',
                                field: 'number1',
                                info: 'stepSizes',
                                item: numberInput({
                                    fill: true,
                                    stepSize: 1000,
                                    majorStepSize: 100000,
                                    minorStepSize: 100
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
                                    selectOnFocus: true
                                })
                            }),
                            row({
                                label: 'Slider',
                                field: 'number3',
                                info: 'max, min, stepSizes',
                                item: slider({
                                    max: 100,
                                    min: 0,
                                    labelStepSize: 25,
                                    stepSize: 1
                                })
                            }),
                            row({
                                label: 'Slider',
                                field: 'range1',
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
                                    })}`
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
                                    enableClear: true
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
                                    timePickerProps: {useAmPm: true}
                                })
                            })
                        ]
                    }),
                    vbox({
                        className: 'toolbox-controls-panel__column',
                        items: [
                            row({
                                label: 'Select',
                                field: 'option2',
                                info: 'enableClear:true',
                                item: select({
                                    options: restaurants,
                                    enableClear: true,
                                    placeholder: 'Search restaurants...'
                                })
                            }),
                            row({
                                label: 'Select',
                                field: 'option1',
                                info: 'enableFilter:false',
                                layout: {width: 150},
                                item: select({
                                    options: usStates,
                                    enableFilter: false,
                                    placeholder: 'Select a state...'
                                })
                            }),
                            row({
                                label: 'Select',
                                field: 'option3',
                                info: 'custom fields, renderer, async search',
                                item: select({
                                    valueField: 'id',
                                    labelField: 'name',
                                    enableClear: true,
                                    queryFn: this.queryCompaniesAsync,
                                    optionRenderer: this.renderCompanyOption,
                                    placeholder: 'Search companies...'
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
                                    placeholder: 'Select state(s)...'
                                })
                            }),
                            row({
                                label: 'Checkbox',
                                field: 'bool1',
                                item: checkbox({
                                    label: 'enabled'
                                })
                            }),
                            row({
                                label: 'SwitchInput',
                                field: 'bool2',
                                item: switchInput({
                                    label: 'Enabled:',
                                    labelAlign: 'left'
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
        });
    }

    row = ({label, field, item, info, readonlyRenderer, fmtVal, layout = {}}) => {
        const fieldModel = this.model.formModel.fields[field];

        if (!layout.width) layout.flex = 1;

        return box({
            className: 'controls-panel-field-box',
            items: [
                fieldDisplay({fieldModel, fmtVal}),
                formField({
                    item,
                    label,
                    field,
                    info,
                    readonlyRenderer,
                    ...layout
                })
            ]
        });
    };

    queryCompaniesAsync = (query) => {
        return XH.companyService.queryAsync(query)
            .wait(400)
            .then(hits => hits);
    };

    renderCompanyOption = (opt) => {
        return hbox({
            items: [
                box({
                    item: opt.isActive ?
                        Icon.checkCircle({className: 'xh-green'}) :
                        Icon.x({className: 'xh-red'}),
                    width: 32,
                    paddingLeft: 8
                }),
                div(
                    opt.name,
                    div({
                        className: 'xh-text-color-muted xh-font-size-small',
                        item: `${opt.city} · ID: ${opt.id}`
                    })
                )
            ],
            alignItems: 'center'
        });
    }

    renderToolbar() {
        const {model} = this,
            {formModel} = model;

        return toolbar(
            switchInput({
                model: formModel,
                bind: 'readonly',
                label: 'Read-only'
            }),
            switchInput({
                model: formModel,
                bind: 'disabled',
                label: 'Disabled'
            }),
            switchInput({
                model,
                bind: 'commitOnChange',
                label: 'Commit on change'
            })
        );
    }

}

//--------------------------------------------------
// Monitor and display the current value of a field.
//--------------------------------------------------
@HoistComponent
class FieldDisplay extends Component {
    render() {
        const {fieldModel, fmtVal} = this.props;

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
            className: 'controls-panel-field-display',
            item: displayVal
        });
    }
}
const fieldDisplay = elemFactory(FieldDisplay);
