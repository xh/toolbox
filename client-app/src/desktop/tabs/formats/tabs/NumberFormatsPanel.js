import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
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

@HoistComponent
export class NumberFormatsPanel extends Component {
    model = new NumberFormatsPanelModel();

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
                title: 'Number Format',
                className: 'toolbox-formats-tab',
                width: '90%',
                height: '90%',
                item: hframe(
                    this.renderParams(),
                    resultsPanel({model: this.model, tryItInput: numberInput({selectOnFocus: true})})
                )
            })
        });
    }

    renderParams() {
        const {model} = this;
        return panel({
            title: 'Format',
            className: 'toolbox-formats-tab__panel',
            flex: 1,
            items: [
                param({
                    model,
                    label: 'Function',
                    bind: 'fnName',
                    item: radioInput({
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
                    className: 'toolbox-formats-tab__panel__card',
                    items: [
                        param({
                            model,
                            bind: 'precision',
                            item: select({options: ['auto', 0, 1, 2, 3, 4, 5, 6], enableCreate: false, width: 75}),
                            info: 'precision'
                        }),
                        param({
                            model,
                            bind: 'zeroPad',
                            item: switchInput(),
                            info: 'pad with zeros out to fully specified precision'
                        }),
                        param({
                            model,
                            bind: 'ledger',
                            item: switchInput(),
                            info: 'use ledger formatting'
                        }),
                        param({
                            model,
                            bind: 'forceLedgerAlign',
                            item: switchInput(),
                            info: 'insert additional space to align numbers in ledger format'
                        }),
                        param({
                            model,
                            bind: 'withPlusSign',
                            item: switchInput(),
                            info: 'use explicit plus sign for positive numbers'
                        }),
                        param({
                            model,
                            bind: 'withSignGlyph',
                            item: switchInput(),
                            info: 'use up/down glyphs to indicate sign'
                        }),
                        param({
                            model,
                            bind: 'colorSpec',
                            item: switchInput(),
                            info: 'color positive and negative numbers (colors configurable)'
                        }),
                        param({
                            model,
                            bind: 'label',
                            item: textInput({commitOnChange: true, width: 50}),
                            info: 'suffix charachters, typically used for units'
                        }),
                        param({
                            model,
                            bind: 'nullDisplay',
                            item: textInput({commitOnChange: true, width: 50}),
                            info: 'format for null values'
                        })
                    ]
                })
            ]
        });
    }
}
