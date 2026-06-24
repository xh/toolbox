import {hbox, input, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistProps} from '@xh/hoist/core';
import {
    numberInput,
    segmentedControl,
    select,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {range} from 'lodash';
import {wrapper, wrapperOption} from '../../../common';
import {NumberFormatsPanelModel} from './NumberFormatsPanelModel';
import {resultsPanel} from './ResultsPanel';
import './Formats.scss';

export const numberFormatsPanel = hoistCmp.factory({
    model: creates(NumberFormatsPanelModel),

    render({model}) {
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
            options: [
                wrapperOption({
                    label: 'Function',
                    control: select({
                        model,
                        bind: 'fnName',
                        width: 150,
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
                wrapperOption({
                    omit: model.fnName !== 'fmtQuantity',
                    label: 'Lossless',
                    propName: 'QuantityFormatOptions.lossless',
                    control: switchInput({model, bind: 'lossless'}),
                    info: 'Compact to m/b only when no precision is lost, else render the full value.'
                }),
                wrapperOption({
                    omit: model.fnName !== 'fmtQuantity',
                    label: 'Use Millions',
                    propName: 'QuantityFormatOptions.useMillions',
                    control: switchInput({model, bind: 'useMillions'}),
                    info: 'Compact values >= 1 million into units of millions (m).'
                }),
                wrapperOption({
                    omit: model.fnName !== 'fmtQuantity',
                    label: 'Use Billions',
                    propName: 'QuantityFormatOptions.useBillions',
                    control: switchInput({model, bind: 'useBillions'}),
                    info: 'Compact values >= 1 billion into units of billions (b).'
                }),
                wrapperOption({
                    label: 'Color Spec',
                    propName: 'NumberFormatOptions.colorSpec',
                    control: segmentedControl({
                        model,
                        bind: 'colorSpec',
                        options: [
                            {value: true, label: 'true'},
                            {value: false, label: 'false'},
                            {value: 'custom', label: 'Custom'}
                        ]
                    }),
                    info: 'Color by sign, or set custom colors.'
                }),
                wrapperOption({
                    omit: model.colorSpec !== 'custom',
                    label: 'Custom Colors',
                    control: hbox({
                        alignItems: 'center',
                        gap: 4,
                        items: [
                            colorInput({bind: 'positiveColor', title: 'Positive'}),
                            colorInput({bind: 'negativeColor', title: 'Negative'}),
                            colorInput({bind: 'neutralColor', title: 'Neutral'})
                        ]
                    }),
                    info: 'Positive / negative / neutral.'
                }),
                wrapperOption({
                    label: 'Precision',
                    propName: 'NumberFormatOptions.precision',
                    control: select({
                        model,
                        bind: 'precision',
                        width: 100,
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {label: 'null', value: -2},
                            {label: 'auto', value: -1},
                            ...range(0, 13)
                        ]
                    }),
                    info: `null for full precision, 'auto' to scale to the value, or fix it.`
                }),
                wrapperOption({
                    label: 'Zero Pad',
                    propName: 'NumberFormatOptions.zeroPad',
                    control: select({
                        model,
                        bind: 'zeroPad',
                        width: 100,
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {label: 'unset', value: -2},
                            {label: 'false', value: -1},
                            {label: 'true', value: 0},
                            ...range(1, 12)
                        ]
                    }),
                    info: 'Pad to precision or a set length.'
                }),
                wrapperOption({
                    label: 'Ledger',
                    propName: 'NumberFormatOptions.ledger',
                    control: switchInput({model, bind: 'ledger'}),
                    info: 'Parenthesize negatives, ledger-style.'
                }),
                wrapperOption({
                    label: 'Force Ledger Align',
                    propName: 'NumberFormatOptions.forceLedgerAlign',
                    control: switchInput({model, bind: 'forceLedgerAlign'}),
                    info: 'Align mixed signs in ledger format.'
                }),
                wrapperOption({
                    label: 'With Commas',
                    propName: 'NumberFormatOptions.withCommas',
                    control: switchInput({model, bind: 'withCommas'}),
                    info: 'Comma thousands separator.'
                }),
                wrapperOption({
                    label: 'Omit 4-Digit Comma',
                    propName: 'NumberFormatOptions.omitFourDigitComma',
                    control: switchInput({model, bind: 'omitFourDigitComma'}),
                    info: 'Drop the comma in 4-digit integers.'
                }),
                wrapperOption({
                    label: 'With Plus Sign',
                    propName: 'NumberFormatOptions.withPlusSign',
                    control: switchInput({model, bind: 'withPlusSign'}),
                    info: 'Show a + on positive numbers.'
                }),
                wrapperOption({
                    label: 'With Sign Glyph',
                    propName: 'NumberFormatOptions.withSignGlyph',
                    control: switchInput({model, bind: 'withSignGlyph'}),
                    info: 'Up / down glyphs for sign.'
                }),
                wrapperOption({
                    label: 'Strict Zero',
                    propName: 'NumberFormatOptions.strictZero',
                    control: switchInput({model, bind: 'strictZero'}),
                    info: 'Keep the sign of near-zero values.'
                }),
                wrapperOption({
                    label: 'Label',
                    propName: 'NumberFormatOptions.label',
                    control: textInput({model, bind: 'label', commitOnChange: true, width: 90}),
                    info: 'Suffix text, typically units.'
                }),
                wrapperOption({
                    label: 'Prefix',
                    propName: 'NumberFormatOptions.prefix',
                    control: textInput({model, bind: 'prefix', commitOnChange: true, width: 90}),
                    info: 'Sits between sign and number, e.g. $.'
                }),
                wrapperOption({
                    label: 'Null Display',
                    propName: 'FormatOptions.nullDisplay',
                    control: textInput({
                        model,
                        bind: 'nullDisplay',
                        commitOnChange: true,
                        width: 90
                    }),
                    info: 'Custom return for null values.'
                }),
                wrapperOption({
                    label: 'Zero Display',
                    propName: 'NumberFormatOptions.zeroDisplay',
                    control: textInput({
                        model,
                        bind: 'zeroDisplay',
                        commitOnChange: true,
                        width: 90
                    }),
                    info: 'Custom return for 0 values.'
                })
            ],
            item: resultsPanel({
                tryItInput: customValueInput()
            })
        });
    }
});

// Custom-value row for the results table: a left-aligned label paired with a right-aligned,
// commitOnChange numberInput so the prepopulated value reformats live as the user types.
// Receives its `bind` prop via cloneElement in ResultsPanel and forwards it to the input.
const customValueInput = hoistCmp.factory<HoistProps<NumberFormatsPanelModel> & {bind?: string}>(
    ({bind}) =>
        hbox({
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            width: '100%',
            items: [
                span({className: 'tbox-formats-tab__custom-label', item: 'Custom value:'}),
                numberInput({
                    bind,
                    commitOnChange: true,
                    selectOnFocus: true,
                    textAlign: 'right',
                    flex: 1
                })
            ]
        })
);

type ColorBind = 'positiveColor' | 'negativeColor' | 'neutralColor';

const colorInput = hoistCmp.factory<
    HoistProps<NumberFormatsPanelModel> & {bind: ColorBind; title: string}
>(({bind, title, model}) =>
    input({
        type: 'color',
        title,
        className: 'tbox-formats-color',
        value: model[bind],
        onChange: e => model.setBindable(bind, e.target.value)
    })
);
