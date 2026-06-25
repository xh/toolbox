import {creates, hoistCmp} from '@xh/hoist/core';
import {dateInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {wrapper, wrapperOption} from '../../../common';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import './Formats.scss';

export const dateFormatsPanel = hoistCmp.factory({
    model: creates(DateFormatsPanelModel),

    render({model}) {
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
            options: [
                wrapperOption({
                    label: 'Function',
                    control: select({
                        model,
                        bind: 'fnName',
                        width: 150,
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: ['fmtDate', 'fmtCompactDate', 'fmtDateTime', 'fmtTime']
                    })
                }),
                wrapperOption({
                    label: 'Format String',
                    propName: 'DateFormatOptions.fmt',
                    control: textInput({
                        model,
                        bind: 'fmt',
                        commitOnChange: true,
                        disabled: !model.enableFmt,
                        placeholder: 'e.g. MMM DD',
                        width: 130
                    }),
                    info: 'moment.js format; fmtDate only.'
                }),
                wrapperOption({
                    label: 'Null Display',
                    propName: 'DateFormatOptions.nullDisplay',
                    control: textInput({
                        model,
                        bind: 'nullDisplay',
                        commitOnChange: true,
                        width: 90
                    }),
                    info: 'Custom return for null values.'
                }),
                wrapperOption({
                    label: 'Tooltip',
                    propName: 'FormatOptions.tooltip',
                    control: switchInput({model, bind: 'tooltip'}),
                    info: 'Show the full date on hover.'
                })
            ],
            item: resultsPanel({
                tryItInput: dateInput({timePrecision: 'minute', textAlign: 'right'})
            })
        });
    }
});
