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
    numberInput, radioInput,
    switchInput, TextInput, textInput
} from '@xh/hoist/desktop/cmp/form';

import {card, controlGroup, formGroup, FormGroup} from '@xh/hoist/kit/blueprint';
import {NumberFormatsPanelModel} from './NumberFormatsPanelModel';
import './FormatsTab.scss';


@HoistComponent
export class NumberFormatsPanel extends Component {
    localModel = new NumberFormatsPanelModel();
    render() {
        const {model, row} = this;

        return wrapper({
            description: [
                <p>
                    Hoist provides a collection of number formatting functions in <a href="https://github.com/exhi/hoist-react/blob/master/format/FormatNumber.js" target="_blank">FormatNumber.js</a>.  There are several built-in functions for common use cases and a lower-level 'fmtNumber' function by which formatting can be further customized.  FormatNumber is backed by <a href="https://numbrojs.com/" target="_blank">numbro.js</a>.  Any formatting needs not met by the built-in methods or custom options can be met by passing numbro.js configs to fmtNumber via the 'formatConfig' property.
                </p>
            ],
            item:
                panel({
                    title: 'Number Format',
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
                                                {value: 'fmtQuantity', label: code('fmtQuantity')},
                                                {value: 'fmtPrice', label: code('fmtPrice')},
                                                {value: 'fmtPercent', label: code('fmtPercent')},
                                                {value: 'fmtThousands', label: code('fmtThousands')},
                                                {value: 'fmtMillions', label: code('fmtMillions')},
                                                {value: 'fmtBillions', label: code('fmtBillions')}
                                            ]
                                        })
                                    }),
                                    row({
                                        label: 'Custom',
                                        field: 'builtinFunction',
                                        item: radioInput({
                                            alignIndicator: 'left',
                                            onChange: (val) => model.handleBuiltinFunctionChange(val),
                                            options: [{value: 'fmtNumber', label: code('fmtNumber')}]
                                        })
                                    }),
                                    card({
                                        className: 'toolbox-formats-tab__panel__card',
                                        omit: model.singleOptionsDisabled,
                                        items: [
                                            controlGroup({
                                                items: [
                                                    formGroup({
                                                        helperText: 'or',
                                                        item: switchInput({
                                                            model: model,
                                                            field: 'precisionAuto',
                                                            disabled: model.singleOptionsDisabled
                                                        })
                                                    }),
                                                    formGroup({
                                                        helperText: `precision:  ${model.precision == 'auto' ? '"auto" - enables heuristic based auto-rounding.' : model.precision}`,
                                                        item: numberInput({
                                                            model: model,
                                                            field: 'precisionNumber',
                                                            min: 0,
                                                            max: 12,
                                                            width: 36,
                                                            selectOnFocus: true,
                                                            commitOnChange: true,
                                                            disabled: model.precisionAuto || model.singleOptionsDisabled
                                                        })
                                                    })
                                                ]

                                            }),
                                            row({
                                                field: 'zeroPad',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `zeroPad:  ${model.zeroPad}`
                                            }),
                                            row({
                                                field: 'ledger',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `ledger:  ${model.ledger}`
                                            }),
                                            row({
                                                field: 'forceLedgerAlign',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `forceLedgerAlign:  ${model.forceLedgerAlign}`
                                            }),
                                            row({
                                                field: 'withPlusSign',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `withPlusSign:  ${model.withPlusSign}`
                                            }),
                                            row({
                                                field: 'withSignGlyph',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `withSignGlyph:  ${model.withSignGlyph}`
                                            }),
                                            row({
                                                field: 'colorSpec',
                                                item: switchInput({
                                                    disabled: model.singleOptionsDisabled
                                                }),
                                                info: `colorSpec:  ${model.colorSpec}`
                                            }),
                                            row({
                                                field: 'label',
                                                item: textInput({
                                                    disabled: model.singleOptionsDisabled,
                                                    commitOnChange: true
                                                }),
                                                info: `label:  ${model.label ? '"' + model.label + '"' : ''}`
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
                                            {model.formattedNumbers}
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
