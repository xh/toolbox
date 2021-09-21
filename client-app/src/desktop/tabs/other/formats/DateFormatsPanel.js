import React from 'react';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../../common';
import {code, hframe} from '@xh/hoist/cmp/layout';
import {dateInput, radioInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {card} from '@xh/hoist/kit/blueprint';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import {param} from './Util';
import './Styles.scss';

export const dateFormatsPanel = hoistCmp.factory({
    model: creates(DateFormatsPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist provides a collection of date formatting functions in <code>@xh/hoist/format</code>.
                    The main method is <code>fmtDate</code> which provides a few useful options.
                </p>,
                <p>
                    <code>fmtDate</code> is backed by <a href="https://momentjs.com/" target="_blank">moment.js </a>,
                    and makes the full moment API available via the <code>fmt</code> option, which takes a moment js
                    string. Convenience methods delegate to <code>fmtDate</code> with a useful <code>fmt</code> default.
                </p>,
                <p>
                    All hoist formatting functions support the <code>asElement</code> option to produce either a React
                    element, or a raw HTML string. This allows them to be useful in a both raw React and non-React
                    contexts.
                </p>
            ],
            item: panel({
                title: 'Other › Date Formats',
                icon: Icon.print(),
                className: 'tbox-formats-tab',
                height: 300,
                item: hframe(
                    paramsPanel(),
                    resultsPanel({
                        tryItInput: dateInput({timePrecision: 'minute', textAlign: 'right'})
                    })
                )
            })
        });
    }
});

const paramsPanel = hoistCmp.factory(
    ({model}) => panel({
        title: 'Function + Options',
        compactHeader: true,
        className: 'tbox-formats-tab__panel',
        flex: 1,
        items: [
            param({
                bind: 'fnName',
                input: radioInput({
                    inline: true,
                    options: [
                        {value: 'fmtDate', label: code('fmtDate')},
                        {value: 'fmtCompactDate', label: code('fmtCompactDate')},
                        {value: 'fmtDateTime', label: code('fmtDateTime')},
                        {value: 'fmtTime', label: code('fmtTime')}
                    ]
                })
            }),
            card({
                className: 'tbox-formats-tab__panel__card',
                items: [
                    param({
                        disabled: !model.enableFmt,
                        bind: 'fmt',
                        input: textInput({commitOnChange: true}),
                        info: 'a moment.js format string'
                    }),
                    param({
                        bind: 'nullDisplay',
                        input: textInput({commitOnChange: true}),
                        info: 'format for null values'
                    }),
                    param({
                        bind: 'tooltip',
                        input: switchInput(),
                        info: 'function to generate a tooltip string (enable for default)'
                    })
                ]
            })
        ]
    })
);
