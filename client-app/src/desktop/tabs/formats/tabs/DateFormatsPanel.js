import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {hoistComponent, useLocalModel} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../../common/Wrapper';
import {code, hframe} from '@xh/hoist/cmp/layout';
import {
    radioInput,
    switchInput,
    textInput,
    dateInput
} from '@xh/hoist/desktop/cmp/input';

import {card} from '@xh/hoist/kit/blueprint';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import {param} from './Util';
import './Styles.scss';


export const DateFormatsPanel = hoistComponent(
    () => {
        const model = useLocalModel(DateFormatsPanelModel);

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
                title: 'Formats › Dates',
                icon: Icon.print(),
                className: 'tbox-formats-tab',
                width: 1100,
                height: 350,
                item: hframe(
                    renderParams(model),
                    resultsPanel({
                        model,
                        tryItInput: dateInput({timePrecision: 'minute', textAlign: 'right'})
                    })
                )
            })
        });
    }
);

function renderParams(model) {
    return panel({
        title: 'Function + Options',
        compactHeader: true,
        className: 'tbox-formats-tab__panel',
        flex: 1,
        items: [
            param({
                model,
                bind: 'fnName',
                item: radioInput({
                    alignIndicator: 'left',
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
                        model,
                        disabled: !model.enableFmt,
                        bind: 'fmt',
                        item: textInput({commitOnChange: true}),
                        info: 'a moment.js format string.'
                    }),
                    param({
                        model,
                        bind: 'nullDisplay',
                        item: textInput({commitOnChange: true}),
                        info: 'format for null values'
                    }),
                    param({
                        model,
                        bind: 'tooltip',
                        item: switchInput(),
                        info: 'function to generate a tooltip string (enable for default)'
                    })
                ]
            })
        ]
    });
}
