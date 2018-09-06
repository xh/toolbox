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
import {button} from "@xh/hoist/desktop/cmp/button"

import {formGroup} from "@xh/hoist/kit/blueprint";
import {FormatsTabModel} from './FormatsTabModel';
import {capitalize, toLower} from 'lodash';
import './FormatsTab.scss';


@HoistComponent()
export class FormatsTab extends Component {
    localModel = new FormatsTabModel();
    render() {
        const {model, row} = this;

        const scaleOptions = [
            'Default',
            'None',
            'Thousands',
            'Millions',
            'Billions'
        ];

        const sampleNumbers = this.localModel.testnumbers.split(",").map(v => parseFloat(v.trim()));
        const fOptions = {
            asElement: true,
            label: this.localModel.label === 'Default' ? null : toLower(this.localModel.label),
            precision: this.localModel.precision,
            zeroPad: this.localModel.zeropad,
            decimalTolerance: this.localModel.decimaltolerance
        };
        const formattedNumbers = sampleNumbers.map(
            (num, index) =>
                        <tr key={`num-${index}`}>
                            <td>{index + 1}.</td>
                            <td align="right">
                                {sampleNumbers[index]}
                            </td>
                            <td align="right">
                                {fmtCompact(num, fOptions)}
                            </td>
                        </tr>
        );
        return wrapper({
            item:
                panel({
                    title: 'Compact Number Formatter',
                    className: 'toolbox-forms-tab',
                    width: '90%',
                    height: '90%',
                    item: hframe({
                        items: [
                            hframe({
                                items: [
                                    panel({
                                        className: 'toolbox-formats-tab__panel',
                                        width: '50%',
                                        items: [
                                            row({
                                            label: 'Test Numbers',
                                            field: 'testnumbers',
                                            item: textAreaField({
                                                style: {
                                                    height: '400px'
                                                }
                                            }),
                                            display: false,
                                            info: 'Comma Separated List'
                                            }),
                                            button({
                                                text: 'Run Test'
                                            })
                                            ]

                                    }),
                                    panel({
                                        className: 'toolbox-formats-tab__panel',
                                        width: '50%',
                                        items: [
                                            row({
                                                label: 'Precision',
                                                field: 'precision',
                                                item: numberField({
                                                    style: {
                                                        width: '50%'
                                                    }
                                                }),
                                                info: 'Max digits to the right of decimal place'
                                            }),
                                            row({
                                                label: 'Decimal Tolerance',
                                                field: 'decimaltolerance',
                                                item: numberField({
                                                    style: {
                                                        width: '50%'
                                                    }
                                                }),
                                                info: 'Number of decimal places tolerated before downsizing label. Should be less than or equal to precision'
                                            }),
                                            row({
                                                label: 'Zero Pad',
                                                field: 'zeropad',
                                                item: numberField({
                                                    style: {
                                                        width: '50%'
                                                    }
                                                }),
                                                info: 'Zero padding applied where possible'
                                            }),
                                            row({
                                                label: 'Label',
                                                field: 'label',
                                                item: selectField({
                                                    options: scaleOptions,
                                                    placeholder: 'Select label...'
                                                }),
                                                info: 'Default: Apply scale to each number based on its size'
                                            })
                                        ]
                                    })
                                ]
                            }),
                            panel({
                                className: 'toolbox-formats-tab__panel',
                                title: 'Results',
                                width: '50%',
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
                                                {formattedNumbers}
                                            </tbody>
                                        </table>

                                ]
                            })
                        ]
                    })
                })
        });
    }

    row = ({label, field, item, info, display=true}) => {
        const {model} = this;

        const formProps = {
            label: label || capitalize(field),
            item: React.cloneElement(item, {model, field}),
            helperText: info
        };
        if (display) formProps.labelInfo = model[field];

        return formGroup(formProps);
    }


}
