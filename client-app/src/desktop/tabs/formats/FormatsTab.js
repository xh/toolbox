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
import {hframe} from '@xh/hoist/cmp/layout';
import {
    numberInput,
    switchInput,
    textArea
} from '@xh/hoist/desktop/cmp/form';

import {formGroup} from '@xh/hoist/kit/blueprint';
import {FormatsTabModel} from './FormatsTabModel';
import './FormatsTab.scss';


@HoistComponent
export class FormatsTab extends Component {
    localModel = new FormatsTabModel();
    render() {
        const {model, row} = this;

        return wrapper({
            item:
                panel({
                    title: 'Compact Number Formatter',
                    className: 'toolbox-formats-tab',
                    width: '90%',
                    height: '90%',
                    item: hframe({
                        items: [
                            panel({
                                title: 'Input',
                                className: 'toolbox-formats-tab__panel',
                                flex: 1,
                                item: [
                                    row({
                                        field: 'testNumbers',
                                        className: 'formats-text-area-input',
                                        item: textArea({
                                            style: {
                                                textAlign: 'right',
                                                fontSize: 'larger',
                                                height: model.textAreaRows * 15
                                            },
                                            commitOnChange: true
                                        }),
                                        info: 'Enter one number per line'
                                    })
                                ]
                            }),
                            panel({
                                title: 'Parameters',
                                className: 'toolbox-formats-tab__panel',
                                flex: 1,
                                items: [
                                    row({
                                        label: 'Precision - auto',
                                        field: 'precisionAuto',
                                        item: switchInput(),
                                        info: 'If "auto", heuristic based auto-rounding will occur.'
                                    }),
                                    row({
                                        label: 'Precision - numerical',
                                        field: 'precisionNumber',
                                        item: numberInput({
                                            min: 0,
                                            max: 12,
                                            selectOnFocus: true,
                                            disabled: model.precisionAuto
                                        }),
                                        info: 'Max digits to the right of decimal place'
                                    }),

                                    row({
                                        label: 'Zero Pad',
                                        field: 'zeroPad',
                                        item: switchInput(),
                                        info: 'Zero padding applied where possible'
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
                                            {model.formattedNumbers}
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
