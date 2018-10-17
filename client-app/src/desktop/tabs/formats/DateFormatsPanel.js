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
                    Hoist provides a date formatting class: <a href="https://github.com/exhi/hoist-react/blob/master/format/FormatDate.js" target="_blank">FormatDate</a>. The class offers several pre-set functions for common use cases and a lower-level 'fmtDate' method by which formatting can be further customized.  FormatDate is backed by <a href="https://momentjs.com/" target="_blank">momentjs</a>.  Any formatting needs not met by FormatDate's pre-set methods can be met by passing a momentjs format string via the 'fmt' property.
                </p>
            ],
            item:
                panel({
                    title: 'Date Format Tester',
                    className: 'toolbox-formats-tab',
                    width: '90%',
                    height: '90%',
                    item: hframe({
                        items: [
                            panel({
                                title: 'Parameters',
                                className: 'toolbox-formats-tab__panel',
                                flex: 1,
                                items: [
                                    row({
                                        label: 'Pre-set Functions',
                                        field: 'presetFunction',
                                        item: radioInput({
                                            alignIndicator: 'right',
                                            onChange: (val) => model.handlePresetFunctionChange(val),
                                            inline: true,
                                            options: [
                                                {value: 'fmtDateTime', label: code('fmtDateTime'), defaultChecked: true},
                                                'fmtTime',
                                                'fmtCompactDate'
                                            ]
                                        })
                                    }),
                                    row({
                                        label: 'Custom',
                                        field: 'presetFunction',
                                        item: radioInput({
                                            alignIndicator: 'right',
                                            onChange: (val) => model.handlePresetFunctionChange(val),
                                            options: ['fmtDate']
                                        })
                                    }),
                                    card({
                                        className: 'toolbox-formats-tab__panel__card',
                                        omit: model.singleOptionsDisabled,
                                        items: [
                                            row({
                                                label: 'Format',
                                                field: 'fmt',
                                                item: textInput({
                                                    disabled: model.singleOptionsDisabled,
                                                    commitOnChange: true,
                                                    placeholder: 'YYYY-MM-DD'
                                                }),
                                                info: `fmt:  ${model.fmt ? '"' + model.fmt + '"' : 'undefined'} - a MomentJs format string.`
                                            }),
                                            row({
                                                label: 'Tooltip',
                                                field: 'tooltipSwitch',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `tooltip:  ${model.tooltipFunc} - function to generate a tooltip string, passed the original value to be formatted.`
                                            })
                                        ]
                                    })
                                ]
                            }),
                            panel({
                                className: 'toolbox-formats-tab__panel',
                                title: 'Results',
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
                                                        label="Try your own:"
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
