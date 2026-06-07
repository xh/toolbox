import {form} from '@xh/hoist/cmp/form';
import {div, input} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistProps} from '@xh/hoist/core';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    numberInput,
    segmentedControl,
    select,
    slider,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../../common';
import {NumberFormatsPanelModel} from './NumberFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import './Formats.scss';

export const numberFormatsPanel = hoistCmp.factory({
    model: creates(NumberFormatsPanelModel),

    render() {
        return wrapper({
            title: 'Format Numbers',
            icon: Icon.print(),
            description: [
                'Hoist provides a collection of number formatting functions in',
                '`@xh/hoist/format`. The main method is `fmtNumber` which provides several',
                'useful options. More specific methods delegate to `fmtNumber` and set useful',
                'defaults.',
                '',
                '`fmtNumber` is backed by [numbro.js](https://numbrojs.com/) and makes the',
                'full numbro API available via the `formatConfig` property, which takes a',
                'numbro configuration object.',
                '',
                'Pick a function and adjust its options at left to see how each value below is',
                'formatted. All Hoist formatting functions also support the `asHtml` option to',
                'produce a raw HTML string rather than a React element.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/formats/NumberFormatsPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/format/README.md',
                    text: 'Formatting docs',
                    notes: 'Number, date, and misc formatting guide.'
                },
                {
                    url: '$HR/format/FormatNumber.ts',
                    notes: 'fmtNumber and the related number formatting functions.'
                },
                {
                    url: 'https://numbrojs.com/',
                    text: 'numbro.js',
                    notes: 'The underlying number formatting library.'
                }
            ],
            options: numberOptions(),
            item: resultsPanel({
                tryItInput: numberInput({
                    selectOnFocus: true,
                    placeholder: 'Enter a value to test'
                })
            })
        });
    }
});

const numberOptions = hoistCmp.factory<NumberFormatsPanelModel>({
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
                            options: [
                                'fmtNumber',
                                'fmtQuantity',
                                'fmtPrice',
                                'fmtPercent',
                                'fmtThousands',
                                'fmtMillions',
                                'fmtBillions'
                            ]
                        })
                    }),
                    formField({
                        field: 'colorSpec',
                        item: segmentedControl({
                            options: [
                                {value: true, label: 'true'},
                                {value: false, label: 'false'},
                                {value: 'custom', label: 'Custom'}
                            ]
                        }),
                        info: 'Color positive / negative / neutral values.'
                    }),
                    div({
                        className: 'tbox-formats-options__colors',
                        omit: model.formModel.values.colorSpec !== 'custom',
                        items: [
                            div({className: 'tbox-formats-options__colors-label', item: 'pos'}),
                            colorInput({bind: 'positiveColor'}),
                            div({className: 'tbox-formats-options__colors-label', item: 'neg'}),
                            colorInput({bind: 'negativeColor'}),
                            div({
                                className: 'tbox-formats-options__colors-label',
                                item: 'neutral'
                            }),
                            colorInput({bind: 'neutralColor'})
                        ]
                    }),
                    formField({
                        field: 'precision',
                        item: slider({
                            min: -1,
                            max: 12,
                            showTrackFill: false,
                            labelStepSize: 13,
                            labelRenderer: val => (val === -1 ? `'auto'` : val)
                        }),
                        info: `Set to 'auto' to base precision on scale of value, or # for fixed precision.`
                    }),
                    formField({
                        field: 'zeroPad',
                        item: slider({
                            min: -2,
                            max: 11,
                            showTrackFill: false,
                            labelStepSize: 13,
                            labelRenderer: val => {
                                switch (val) {
                                    case -2:
                                        return 'unset';
                                    case -1:
                                        return 'false';
                                    case 0:
                                        return 'true';
                                    default:
                                        return val;
                                }
                            }
                        }),
                        info: 'false to show only significant digits, true to pad out to precision, # to pad to custom length.'
                    }),
                    formField({
                        field: 'label',
                        item: textInput({width: 60}),
                        info: 'Suffix characters, typically used for units.'
                    }),
                    formField({
                        field: 'prefix',
                        item: textInput({width: 60}),
                        info: 'Inserted between the number and its sign (e.g. $).'
                    }),
                    formField({
                        field: 'nullDisplay',
                        item: textInput({width: 60}),
                        info: 'Custom return for null values.'
                    }),
                    formField({
                        field: 'zeroDisplay',
                        item: textInput({width: 60}),
                        info: 'Custom return for 0 values.'
                    }),
                    formField({
                        field: 'ledger',
                        inline: true,
                        item: switchInput(),
                        info: 'Use ledger formatting, with parens to indicate negative numbers.'
                    }),
                    formField({
                        field: 'forceLedgerAlign',
                        inline: true,
                        item: switchInput(),
                        info: 'Ensure mixed pos + neg values vertically align in ledger format.'
                    }),
                    formField({
                        field: 'withCommas',
                        inline: true,
                        item: switchInput(),
                        info: 'Use comma as thousands delimiter.'
                    }),
                    formField({
                        field: 'omitFourDigitComma',
                        inline: true,
                        item: switchInput(),
                        info: 'Suppress withCommas for four-digit integers, for improved readability.'
                    }),
                    formField({
                        field: 'withPlusSign',
                        inline: true,
                        item: switchInput(),
                        info: 'Use explicit plus sign for positive numbers.'
                    }),
                    formField({
                        field: 'withSignGlyph',
                        inline: true,
                        item: switchInput(),
                        info: 'Use up/down glyphs to indicate sign.'
                    }),
                    formField({
                        field: 'strictZero',
                        inline: true,
                        item: switchInput(),
                        info: 'Retain underlying sign of small numbers formatted as zero due to precision.'
                    })
                ]
            })
        });
    }
});

const colorInput = hoistCmp.factory<HoistProps<NumberFormatsPanelModel> & {bind: string}>(
    ({bind, model}) =>
        input({
            type: 'color',
            value: model.formModel.values[bind],
            onChange: e => {
                model.formModel.getField(bind).setValue(e.target.value);
            }
        })
);
