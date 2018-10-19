/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import {code, hframe} from '@xh/hoist/cmp/layout';
import {
    radioInput,
    switchInput,
    TextInput,
    textInput
} from '@xh/hoist/desktop/cmp/form';

import {card, formGroup, FormGroup} from '@xh/hoist/kit/blueprint';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import './FormatsTab.scss';


@HoistComponent
export class DateFormatsPanel extends Component {
    localModel = new DateFormatsPanelModel();
    render() {
        const {model, row} = this;

        return wrapper({
            description: [
                <p>
                    Hoist provides a collection date formatting functions in <a href="https://github.com/exhi/hoist-react/blob/master/format/FormatDate.js" target="_blank">FormatDate.js</a>. There are several built-in functions for common use cases and a lower-level 'fmtDate' function by which formatting can be further customized.  FormatDate is backed by <a href="https://momentjs.com/" target="_blank">momentjs</a>.  Any formatting needs not met by FormatDate's built-in methods can be met by passing a momentjs format string via the 'fmt' property.
                </p>
            ],
            item:
                panel({
                    title: 'Date Format',
                    className: 'toolbox-formats-tab',
                    width: '90%',
                    height: '90%',
                    item: hframe({
                        items: [
                            panel({
                                title: 'Format',
                                className: 'toolbox-formats-tab__panel',
                                flex: 1,
                                items: [
                                    row({
                                        label: 'Built-in Functions',
                                        field: 'builtinFunction',
                                        item: radioInput({
                                            alignIndicator: 'left',
                                            onChange: (val) => model.handleBuiltinFunctionChange(val),
                                            inline: true,
                                            options: [
                                                {value: 'fmtDateTime', label: code('fmtDateTime')},
                                                {value: 'fmtTime', label: code('fmtTime')},
                                                {value: 'fmtCompactDate', label: code('fmtCompactDate')}
                                            ]
                                        })
                                    }),
                                    row({
                                        label: 'Custom',
                                        field: 'builtinFunction',
                                        item: radioInput({
                                            alignIndicator: 'left',
                                            onChange: (val) => model.handleBuiltinFunctionChange(val),
                                            options: [{value: 'fmtDate', label: code('fmtDate')}]
                                        })
                                    }),
                                    card({
                                        className: 'toolbox-formats-tab__panel__card',
                                        omit: model.singleOptionsDisabled,
                                        items: [
                                            row({
                                                field: 'fmt',
                                                item: textInput({
                                                    disabled: model.singleOptionsDisabled,
                                                    commitOnChange: true,
                                                    placeholder: 'YYYY-MM-DD'
                                                }),
                                                info: `fmt:  ${model.fmt ? '"' + model.fmt + '"' : 'undefined'} - a MomentJs format string.`
                                            }),
                                            row({
                                                field: 'tooltipSwitch',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: 'tooltip - function to generate a tooltip string, passed the original date value.'
                                            })
                                        ]
                                    })
                                ]
                            }),
                            panel({
                                className: 'toolbox-formats-tab__panel',
                                title: 'Result',
                                flex: 1,
                                item: [
                                    <table>
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>
                                                    Input
                                                </th>
                                                <th>
                                                    Output
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {model.formattedDates}
                                            <tr key={'num-from-user'}>
                                                <td colSpan={2}
                                                    align="right"
                                                >
                                                    <FormGroup
                                                        label="Try it:"
                                                        inline={true}
                                                        width="90%"
                                                    >
                                                        <TextInput
                                                            model={model}
                                                            field="dateFromUser"
                                                            commitOnChange={true}
                                                            selectOnFocus={true}

                                                            style={{textAlign: 'right'}}
                                                        />
                                                    </FormGroup>
                                                </td>
                                                <td align="right">
                                                    {model.formattedUserInput}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                ]
                            })
                        ]
                    })
                })
        });
    }

    row = ({label, field, item, info}) => {
        const {model} = this;

        const formProps = {
            label: label,
            item: React.cloneElement(item, {model, field}),
            helperText: info
        };
        formProps.labelInfo = model[field];

        return formGroup(formProps);
    };

}
