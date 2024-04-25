import {code, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, dateInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {card} from '@xh/hoist/kit/blueprint';
import React from 'react';
import {wrapper} from '../../../common';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import './Styles.scss';
import {param} from './Util';

export const dateFormatsPanel = hoistCmp.factory({
    model: creates(DateFormatsPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist provides a collection of date formatting functions in{' '}
                    <code>@xh/hoist/format</code>. The main method is <code>fmtDate</code> which
                    provides a few useful options.
                </p>,
                <p>
                    <code>fmtDate</code> is backed by{' '}
                    <a href="https://momentjs.com/" target="_blank">
                        moment.js{' '}
                    </a>
                    , and makes the full moment API available via the <code>fmt</code> option, which
                    takes a moment js string. Convenience methods delegate to <code>fmtDate</code>{' '}
                    with a useful <code>fmt</code> default.
                </p>,
                <p>
                    All hoist formatting functions support the <code>asHtml</code> option to produce
                    a raw HTML string rather than a React element. This allows them to be useful in
                    both React and non-React contexts.
                </p>
            ],
            item: panel({
                title: 'Other › Date Formats',
                icon: Icon.print(),
                className: 'tbox-formats-tab',
                height: 500,
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

const paramsPanel = hoistCmp.factory<DateFormatsPanelModel>(({model}) =>
    panel({
        title: 'Function + Options',
        compactHeader: true,
        className: 'tbox-formats-tab__panel',
        flex: 1,
        items: [
            param({
                bind: 'fnName',
                input: buttonGroupInput({
                    fill: true,
                    outlined: true,
                    items: [
                        button({value: 'fmtDate', text: code('fmtDate')}),
                        button({value: 'fmtCompactDate', text: code('fmtCompactDate')}),
                        button({value: 'fmtDateTime', text: code('fmtDateTime')}),
                        button({value: 'fmtTime', text: code('fmtTime')})
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
