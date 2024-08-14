import {form} from '@xh/hoist/cmp/form';
import {code, div, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {buttonGroupInput, dateInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../../common';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import './Formats.scss';

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
                    All Hoist formatting functions support the <code>asHtml</code> option to produce
                    a raw HTML string rather than a React element. This allows them to be useful in
                    both React and non-React contexts.
                </p>
            ],
            item: panel({
                title: 'Other › Format Dates',
                icon: Icon.print(),
                className: 'tbox-formats-tab',
                height: 500,
                item: hframe({
                    style: {padding: '10px', gap: '10px'},
                    items: [
                        paramsPanel(),
                        resultsPanel({
                            tryItInput: dateInput({timePrecision: 'minute', textAlign: 'right'})
                        })
                    ]
                })
            })
        });
    }
});

const paramsPanel = hoistCmp.factory<DateFormatsPanelModel>({
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
                                button({value: 'fmtDate', text: code('fmtDate')}),
                                button({value: 'fmtCompactDate', text: code('fmtCompactDate')}),
                                button({value: 'fmtDateTime', text: code('fmtDateTime')}),
                                button({value: 'fmtTime', text: code('fmtTime')})
                            ]
                        })
                    })
                ],
                item: div({
                    className: 'tbox-formats-tab__form',
                    items: [
                        formField({
                            field: 'fmt',
                            disabled: !model.enableFmt,
                            item: textInput({commitOnChange: true}),
                            info: 'A moment.js format string.'
                        }),
                        formField({
                            field: 'nullDisplay',
                            item: textInput({commitOnChange: true, width: 50}),
                            info: 'Custom return for null values.'
                        }),
                        formField({
                            field: 'tooltip',
                            item: switchInput()
                        })
                    ]
                })
            })
        });
    }
});
