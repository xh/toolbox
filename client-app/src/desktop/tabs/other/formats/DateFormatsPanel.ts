import {form} from '@xh/hoist/cmp/form';
import {a, code, div, p} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {buttonGroupInput, dateInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../../common';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import './Formats.scss';

export const dateFormatsPanel = hoistCmp.factory({
    model: creates(DateFormatsPanelModel),

    render() {
        return wrapper({
            title: 'Format Dates',
            icon: Icon.print(),
            description: [
                p(
                    'Hoist provides a collection of date formatting functions in @xh/hoist/format. The main method is fmtDate which provides a few useful options.'
                ),
                p(
                    'fmtDate is backed by ',
                    a({href: 'https://momentjs.com/', target: '_blank', item: 'moment.js'}),
                    ', and makes the full moment API available via the fmt option, which takes a moment.js format string. Convenience methods delegate to fmtDate with a useful fmt default.'
                ),
                p(
                    'All Hoist formatting functions support the asHtml option to produce a raw HTML string rather than a React element, making them useful in both React and non-React contexts.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/formats/DateFormatsPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/format/README.md',
                    text: 'Formatting docs',
                    notes: 'Number, date, and misc formatting guide.'
                },
                {
                    url: '$HR/format/FormatDate.ts',
                    notes: 'fmtDate and the related date formatting functions.'
                },
                {
                    url: 'https://momentjs.com/',
                    text: 'moment.js',
                    notes: 'The underlying date parsing and formatting library.'
                }
            ],
            item: panel({
                className: 'tbox-formats-tab',
                height: 500,
                contentBoxProps: {flexDirection: 'row', padding: true, gap: true},
                items: [
                    paramsPanel(),
                    resultsPanel({
                        tryItInput: dateInput({timePrecision: 'minute', textAlign: 'right'})
                    })
                ]
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
