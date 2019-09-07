import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {hoistComponent, localModel, hoistCmpFactory} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../../common/Wrapper';
import {code, hframe} from '@xh/hoist/cmp/layout';
import {
    numberInput,
    radioInput,
    switchInput,
    textInput,
    select
} from '@xh/hoist/desktop/cmp/input';

import {card} from '@xh/hoist/kit/blueprint';
import {NumberFormatsPanelModel} from './NumberFormatsPanelModel';
import './Styles.scss';
import {resultsPanel} from './ResultsPanel';
import {param} from './Util';

export const NumberFormatsPanel = hoistComponent({
    model: localModel(NumberFormatsPanelModel),

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
                title: 'Formats › Numbers',
                icon: Icon.print(),
                className: 'tbox-formats-tab',
                width: 1000,
                item: hframe(
                    params(),
                    resultsPanel({
                        tryItInput: numberInput({selectOnFocus: true, placeholder: 'Enter a value to test'})
                    })
                )
            })
        });
    }
});

const params = hoistCmpFactory(() => {
    return panel({
        title: 'Function + Options',
        compactHeader: true,
        className: 'tbox-formats-tab__panel',
        flex: 1,
        items: [
            param({
                bind: 'fnName',
                input: radioInput({
                    alignIndicator: 'left',
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
    });
});
