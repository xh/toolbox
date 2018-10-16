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
    numberInput, radioInput,
    switchInput, TextInput, textInput
} from '@xh/hoist/desktop/cmp/form';

import {card, formGroup, FormGroup} from '@xh/hoist/kit/blueprint';
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
                    title: 'Number Format Tester',
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
                                                {value: 'fmtThousands', label: 'fmtThousands', defaultChecked: true},
                                                'fmtMillions',
                                                'fmtBillions',
                                                'fmtQuantity',
                                                'fmtPrice',
                                                'fmtPercent'
                                            ]
                                        })
                                    }),
                                    row({
                                        label: 'Custom',
                                        field: 'presetFunction',
                                        item: radioInput({
                                            alignIndicator: 'right',
                                            onChange: (val) => model.handlePresetFunctionChange(val),
                                            options: ['fmtNumber']
                                        })
                                    }),
                                    card({
                                        className: 'toolbox-formats-tab__panel__card',
                                        omit: model.singleOptionsDisabled,
                                        items: [
                                            row({
                                                label: 'Precision - auto',
                                                field: 'precisionAuto',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `precision:  ${model.precision}.  "auto" enables heuristic based auto-rounding.`
                                            }),
                                            row({
                                                label: 'Precision - numerical',
                                                field: 'precisionNumber',
                                                item: numberInput({
                                                    min: 0,
                                                    max: 12,
                                                    width: 36,
                                                    selectOnFocus: true,
                                                    commitOnChange: true,
                                                    disabled: model.precisionAuto || model.singleOptionsDisabled
                                                }),
                                                info: `precision:  ${model.precision}. Specifies max digits to the right of decimal place.`
                                            }),

                                            row({
                                                label: 'Zero Pad',
                                                field: 'zeroPad',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `zeroPad:  ${model.zeroPad}`
                                            }),
                                            row({
                                                label: 'Ledger',
                                                field: 'ledger',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `ledger:  ${model.ledger}`
                                            }),
                                            row({
                                                label: 'Force Ledger Align',
                                                field: 'forceLedgerAlign',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `forceLedgerAlign:  ${model.forceLedgerAlign}`
                                            }),
                                            row({
                                                label: 'With Plus Sign',
                                                field: 'withPlusSign',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `withPlusSign:  ${model.withPlusSign}`
                                            }),
                                            row({
                                                label: 'With Sign Glyph',
                                                field: 'withSignGlyph',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `withSignGlyph:  ${model.withSignGlyph}`
                                            }),
                                            row({
                                                label: 'Color Spec',
                                                field: 'colorSpec',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `colorSpec:  ${model.colorSpec}`
                                            }),
                                            row({
                                                label: 'Label',
                                                field: 'label',
                                                item: textInput({
                                                    disabled: model.singleOptionsDisabled,
                                                    commitOnChange: true
                                                }),
                                                info: `label:  ${model.label ? '"' + model.label + '"' : 'undefined'}`
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
                                            {model.formattedNumbers}
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
                                                            field="numberFromUser"
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
