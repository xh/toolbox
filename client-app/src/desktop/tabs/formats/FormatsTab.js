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
import {fmtCompact} from '@xh/hoist/format/FormatNumber';
import {hframe} from "@xh/hoist/cmp/layout";
import {
    numberField,
    selectField,
    textAreaField
} from "@xh/hoist/desktop/cmp/form";

import {formGroup} from "@xh/hoist/kit/blueprint";
import {FormatsTabModel} from './FormatsTabModel';
import {capitalize, toLower} from 'lodash';
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
                                        item: textAreaField({
                                            style: {
                                                textAlign: 'right',
                                                height: '300px'
                                            }
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
                                        label: 'Precision',
                                        field: 'precision',
                                        item: numberField({
                                            min: 0,
                                            max: 4,
                                            selectOnFocus: true
                                        }),
                                        info: 'Max digits to the right of decimal place'
                                    }),
                                    row({
                                        label: 'Decimal Tolerance',
                                        field: 'decimalTolerance',
                                        item: numberField({
                                            value: model.decimalTolerance,
                                            selectOnFocus: true
                                        }),
                                        info: 'Number of decimal places tolerated before downsizing units. Should be less than or equal to precision'
                                    }),
                                    row({
                                        label: 'Zero Pad',
                                        field: 'zeroPad',
                                        item: numberField({
                                            stepSize: 1,
                                            min: 0,
                                            max: 10,
                                            selectOnFocus: true
                                        }),
                                        info: 'Zero padding applied where possible'
                                    }),
                                    row({
                                        label: 'Units',
                                        field: 'units',
                                        item: selectField({
                                            options: model.UNIT_OPTIONS,
                                            placeholder: 'Select label...'
                                        }),
                                        info: 'Auto: Apply scale to each number based on its size'
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
    }


}
