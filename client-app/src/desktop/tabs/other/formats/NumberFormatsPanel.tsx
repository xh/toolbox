import {form} from '@xh/hoist/cmp/form';
import {code, div, hbox, hframe, input} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    buttonGroupInput,
    numberInput,
    slider,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../../common';
import {NumberFormatsPanelModel} from './NumberFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import './Formats.scss';

export const numberFormatsPanel = hoistCmp.factory({
    model: creates(NumberFormatsPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist provides a collection of number formatting functions in{' '}
                    <code>@xh/hoist/format</code>. The main method is <code>fmtNumber</code> which
                    provides several useful options. More specific methods delegate to{' '}
                    <code>fmtNumber</code> and set useful defaults.
                </p>,
                <p>
                    <code>fmtNumber</code> is backed by{' '}
                    <a href="https://numbrojs.com/" target="_blank">
                        numbro.js{' '}
                    </a>
                    and makes the full numbro API available via the <code>formatConfig</code>{' '}
                    property, which takes a numbro configuration object.
                </p>,
                <p>
                    All Hoist formatting functions support the <code>asHtml</code> option to produce
                    a raw HTML string rather than a React element. This allows them to be useful in
                    both React and non-React contexts.
                </p>
            ],
            item: panel({
                title: 'Other › Format Numbers',
                icon: Icon.print(),
                className: 'tbox-formats-tab',
                item: hframe({
                    style: {padding: '10px', gap: '10px'},
                    items: [
                        paramsPanel(),
                        resultsPanel({
                            tryItInput: numberInput({
                                selectOnFocus: true,
                                placeholder: 'Enter a value to test'
                            })
                        })
                    ]
                })
            })
        });
    }
});

const paramsPanel = hoistCmp.factory<NumberFormatsPanelModel>({
    render({model}) {
        return form({
            fieldDefaults: {inline: true},
            item: panel({
                title: 'Function + Options',
                compactHeader: true,
                className: 'tbox-formats-tab__panel',
                tbar: [
                    formField({
                        field: 'fnName',
                        label: null,
                        item: buttonGroupInput({
                            outlined: true,
                            intent: 'primary',
                            items: [
                                button({value: 'fmtNumber', text: code('fmtNumber')}),
                                button({value: 'fmtQuantity', text: code('fmtQuantity')}),
                                button({value: 'fmtPrice', text: code('fmtPrice')}),
                                button({value: 'fmtPercent', text: code('fmtPercent')}),
                                button({value: 'fmtThousands', text: code('fmtThousands')}),
                                button({value: 'fmtMillions', text: code('fmtMillions')}),
                                button({value: 'fmtBillions', text: code('fmtBillions')})
                            ]
                        })
                    })
                ],
                item: div({
                    className: 'tbox-formats-tab__form',
                    items: [
                        formField({
                            field: 'colorSpec',
                            item: buttonGroupInput({
                                items: [
                                    button({text: code('true'), value: true}),
                                    button({text: code('false'), value: false}),
                                    button({text: 'Custom', value: 'custom'})
                                ]
                            })
                        }),
                        hbox({
                            className: 'xh-form-field',
                            omit: model.formModel.values.colorSpec !== 'custom',
                            items: [
                                div({
                                    className: 'xh-form-field-label',
                                    item: 'pos / neg / neutral'
                                }),
                                colorInput({bind: 'positiveColor'}),
                                colorInput({bind: 'negativeColor'}),
                                colorInput({bind: 'neutralColor'})
                            ]
                        }),
                        formField({
                            field: 'forceLedgerAlign',
                            item: switchInput(),
                            info: 'Ensure mixed pos + neg values vertically align in ledger format.'
                        }),
                        formField({
                            field: 'label',
                            item: textInput({commitOnChange: true, width: 50}),
                            info: 'Suffix characters, typically used for units.'
                        }),
                        formField({
                            field: 'ledger',
                            item: switchInput(),
                            info: 'Use ledger formatting, with parens to indicate negative numbers.'
                        }),
                        formField({
                            field: 'nullDisplay',
                            item: textInput({commitOnChange: true, width: 50}),
                            info: 'Custom return for null values.'
                        }),
                        formField({
                            field: 'omitFourDigitComma',
                            item: switchInput(),
                            info: 'Suppress withCommas for four-digit integers, for improved readability.'
                        }),
                        formField({
                            field: 'precision',
                            item: slider({
                                min: -1,
                                max: 12,
                                width: 500,
                                showTrackFill: false,
                                labelRenderer: val => {
                                    switch (val) {
                                        case -2:
                                            return 'Unset';
                                        case -1:
                                            return `'auto'`;
                                        default:
                                            return val;
                                    }
                                }
                            }),
                            info: `Set to 'auto' to base precision on scale of value, or # for fixed precision.`
                        }),
                        formField({
                            field: 'prefix',
                            item: textInput({commitOnChange: true, width: 50}),
                            info: 'Inserted between the number and its sign (e.g. $).'
                        }),
                        formField({
                            field: 'strictZero',
                            item: switchInput(),
                            info: 'true to retain underlying sign of small numbers formatted as zero due to precision'
                        }),
                        formField({
                            field: 'withCommas',
                            item: switchInput(),
                            info: 'use comma as thousands delimiter'
                        }),
                        formField({
                            field: 'withPlusSign',
                            item: switchInput(),
                            info: 'use explicit plus sign for positive numbers'
                        }),
                        formField({
                            field: 'withSignGlyph',
                            item: switchInput(),
                            info: 'use up/down glyphs to indicate sign'
                        }),
                        formField({
                            field: 'zeroDisplay',
                            item: textInput({commitOnChange: true, width: 50}),
                            info: 'custom return for 0 values'
                        }),
                        formField({
                            field: 'zeroPad',
                            item: slider({
                                min: -2,
                                max: 11,
                                width: 500,
                                showTrackFill: false,
                                labelRenderer: val => {
                                    switch (val) {
                                        case -2:
                                            return 'unset';
                                        case -1:
                                            return 'false';
                                        case 0:
                                            return 'true';
                                        default:
                                            return val;
                                    }
                                }
                            }),
                            info: 'false to show only significant digits, true to pad out to precision, # to pad to custom length'
                        })
                    ]
                })
            })
        });
    }
});

const colorInput = hoistCmp.factory<HoistProps<NumberFormatsPanelModel> & {bind: string}>(
    ({bind, model}) =>
        input({
            type: 'color',
            value: model.formModel.values[bind],
            onChange: e => {
                model.formModel.getField(bind).setValue(e.target.value);
            }
        })
);
