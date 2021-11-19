import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../../common';
import {code, hframe} from '@xh/hoist/cmp/layout';
import {numberInput, radioInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {card} from '@xh/hoist/kit/blueprint';
import {NumberFormatsPanelModel} from './NumberFormatsPanelModel';
import './Styles.scss';
import {resultsPanel} from './ResultsPanel';
import {param} from './Util';

export const numberFormatsPanel = hoistCmp.factory({
    model: creates(NumberFormatsPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist provides a collection of number formatting functions in <code>@xh/hoist/format</code>.
                    The main method is <code>fmtNumber</code> which provides several useful options. More specific
                    methods delegate to <code>fmtNumber</code> and set useful defaults.
                </p>,
                <p>
                    All hoist formatting functions support the <code>asElement</code> option to produce either a React
                    element, or a raw HTML string. This allows them to be useful in both React and non-React
                    contexts.
                </p>
            ],
            item: panel({
                title: 'Other › Number Formats',
                icon: Icon.print(),
                className: 'tbox-formats-tab',
                height: 610,
                item: hframe(
                    paramsPanel(),
                    resultsPanel({
                        // numberInput cannot accept a value greater than Number.MAX_SAFE_INTEGER
                        // so cannot be used for testing the formatting of values bigger than that.
                        tryItInput: numberInput({
                            precision: 12, // max decimal precision allowed by fmtNumber
                            selectOnFocus: true,
                            placeholder: 'Enter a value to test'
                        })
                    })
                )
            })
        });
    }
});

const paramsPanel = hoistCmp.factory(
    () => panel({
        title: 'Function + Options',
        compactHeader: true,
        className: 'tbox-formats-tab__panel',
        items: [
            param({
                bind: 'fnName',
                input: radioInput({
                    inline: true,
                    options: [
                        {value: 'fmtNumber', label: code('fmtNumber')},
                        {value: 'fmtQuantity', label: code('fmtQuantity')},
                        {value: 'fmtPrice', label: code('fmtPrice')},
                        {value: 'fmtPercent', label: code('fmtPercent')},
                        {value: 'fmtThousands', label: code('fmtThousands')},
                        {value: 'fmtMillions', label: code('fmtMillions')},
                        {value: 'fmtBillions', label: code('fmtBillions')}
                    ]
                })
            }),
            card({
                className: 'tbox-formats-tab__panel__card',
                items: [
                    param({
                        bind: 'precision',
                        input: select({options: ['auto', 0, 1, 2, 3, 4, 5, 6], enableFilter: false, width: 75}),
                        info: 'precision'
                    }),
                    param({
                        bind: 'zeroPad',
                        input: switchInput(),
                        info: 'pad with zeros out to fully specified precision'
                    }),
                    param({
                        bind: 'ledger',
                        input: switchInput(),
                        info: 'use ledger formatting'
                    }),
                    param({
                        bind: 'forceLedgerAlign',
                        input: switchInput(),
                        info: 'insert additional space to align numbers in ledger format'
                    }),
                    param({
                        bind: 'withPlusSign',
                        input: switchInput(),
                        info: 'use explicit plus sign for positive numbers'
                    }),
                    param({
                        bind: 'withSignGlyph',
                        input: switchInput(),
                        info: 'use up/down glyphs to indicate sign'
                    }),
                    param({
                        bind: 'withCommas',
                        input: switchInput(),
                        info: 'include commas delimiters'
                    }),
                    param({
                        bind: 'omitFourDigitComma',
                        input: switchInput(),
                        info: 'values under 10,000 will not be delimited'
                    }),
                    param({
                        bind: 'colorSpec',
                        input: switchInput(),
                        info: 'color positive and negative numbers (colors configurable)'
                    }),
                    param({
                        bind: 'label',
                        input: textInput({commitOnChange: true, width: 50}),
                        info: 'suffix characters, typically used for units'
                    }),
                    param({
                        bind: 'nullDisplay',
                        input: textInput({commitOnChange: true, width: 50}),
                        info: 'format for null values'
                    })
                ]
            })
        ]
    })
);
