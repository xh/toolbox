import {code, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    buttonGroupInput,
    numberInput,
    select,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {card} from '@xh/hoist/kit/blueprint';
import React from 'react';
import {wrapper} from '../../../common';
import {NumberFormatsPanelModel} from './NumberFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import './Styles.scss';
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
                    <code>fmtNumber</code> is backed by <a href="https://numbrojs.com/" target="_blank">numbro.js </a>
                    and makes the full numbro API available via the <code>formatConfig</code> property, which takes a
                    numbro configuration object.
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
                height: 600,
                item: hframe(
                    paramsPanel(),
                    resultsPanel({
                        tryItInput: numberInput({selectOnFocus: true, placeholder: 'Enter a value to test'})
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
                input: buttonGroupInput({
                    fill: true,
                    outlined: true,
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
