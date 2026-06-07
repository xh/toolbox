import {form} from '@xh/hoist/cmp/form';
import {div} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {dateInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
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
                'Hoist provides a collection of date formatting functions in',
                '`@xh/hoist/format`. The main method is `fmtDate` which provides a few useful',
                'options.',
                '',
                '`fmtDate` is backed by [moment.js](https://momentjs.com/), and makes the full',
                'moment API available via the `fmt` option, which takes a moment.js format',
                'string. Convenience methods delegate to `fmtDate` with a useful `fmt`',
                'default.',
                '',
                'Pick a function and adjust its options at left to see how each date below is',
                'formatted. All Hoist formatting functions also support the `asHtml` option to',
                'produce a raw HTML string rather than a React element.'
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
            options: dateOptions(),
            item: resultsPanel({
                tryItInput: dateInput({timePrecision: 'minute', textAlign: 'right'})
            })
        });
    }
});

const dateOptions = hoistCmp.factory<DateFormatsPanelModel>({
    render({model}) {
        return form({
            fieldDefaults: {inline: false, commitOnChange: true},
            item: div({
                className: 'tbox-formats-options',
                items: [
                    formField({
                        field: 'fnName',
                        label: 'Function',
                        item: select({
                            enableFilter: false,
                            hideSelectedOptionCheck: true,
                            options: ['fmtDate', 'fmtCompactDate', 'fmtDateTime', 'fmtTime']
                        })
                    }),
                    formField({
                        field: 'fmt',
                        disabled: !model.enableFmt,
                        item: textInput(),
                        info: 'A moment.js format string. Only applies to fmtDate.'
                    }),
                    formField({
                        field: 'nullDisplay',
                        item: textInput({width: 80}),
                        info: 'Custom return for null values.'
                    }),
                    formField({
                        field: 'tooltip',
                        inline: true,
                        item: switchInput(),
                        info: 'Show the full date in a tooltip on hover.'
                    })
                ]
            })
        });
    }
});
