import {
    compactDate,
    date,
    dateTime,
    dateTimeSec,
    localDate,
    number,
    time
} from '@xh/hoist/cmp/grid';
import {
    billionsTextRenderer,
    billionsRenderer,
    compactDateRenderer,
    dateTextRenderer,
    dateRenderer,
    dateTimeRenderer,
    dateTimeSecRenderer,
    millionsTextRenderer,
    millionsRenderer,
    numberTextRenderer,
    numberRenderer,
    percentTextRenderer,
    percentRenderer,
    priceTextRenderer,
    priceRenderer,
    quantityTextRenderer,
    quantityRenderer,
    thousandsTextRenderer,
    thousandsRenderer,
    timeRenderer
} from '@xh/hoist/format';
import type {ColumnTextRenderer, ColumnRenderer, ColumnSpec} from '@xh/hoist/cmp/grid';
import type {NumberTextRendererOptions, QuantityTextRendererOptions} from '@xh/hoist/format';

/** The store field that a case displays. */
export type ParityField = 'num' | 'date' | 'localDate';

/** One spec or option set, shown through a renderer and through the matching text renderer. */
export interface ParityCase {
    name: string;
    field: ParityField;
    /** Column on the renderer path. Its renderer wins over any text renderer from a spread spec. */
    renderer: ColumnSpec;
    /** Column on the text renderer path. */
    textRenderer: ColumnSpec;
}

export const PARITY_CASES: ParityCase[] = [
    // The built-in specs as shipped, each against the renderer that it replaced.
    specCase('number', 'num', number, numberRenderer({})),
    specCase('date', 'date', date, dateRenderer()),
    specCase('dateTime', 'date', dateTime, dateTimeRenderer()),
    specCase('dateTimeSec', 'date', dateTimeSec, dateTimeSecRenderer()),
    specCase('time', 'date', time, timeRenderer()),
    specCase('compactDate', 'date', compactDate, compactDateRenderer()),
    specCase('localDate', 'localDate', localDate, dateRenderer()),
    {
        name: 'date fmt',
        field: 'date',
        renderer: {...date, renderer: dateRenderer({fmt: 'MMM D', nullDisplay: '-'})},
        textRenderer: {...date, textRenderer: dateTextRenderer({fmt: 'MMM D', nullDisplay: '-'})}
    },

    // Each option the number text renderers take, through numberTextRenderer unless named otherwise.
    numberCase('precision', {precision: 2}),
    numberCase('precision: null', {precision: null}),
    numberCase('zeroPad', {precision: 4, zeroPad: 2}),
    numberCase('ledger', {ledger: true, precision: 0}),
    numberCase('ledger, no align', {ledger: true, forceLedgerAlign: false, precision: 0}),
    numberCase('colorSpec', {colorSpec: true, precision: 0}),
    numberCase('colorSpec classes', {
        colorSpec: {pos: 'xh-neg-val', neg: 'xh-pos-val'},
        precision: 0
    }),
    numberCase('ledger, colorSpec', {ledger: true, colorSpec: true, precision: 0}),
    numberCase('label', {label: 'm', precision: 1}),
    numberCase('withCommas: false', {withCommas: false, precision: 2}),
    numberCase('omitFourDigitComma', {omitFourDigitComma: true, precision: 0}),
    numberCase('withPlusSign', {withPlusSign: true, precision: 2}),
    numberCase('nullDisplay', {nullDisplay: '-', precision: 2}),
    numberCase('zeroDisplay', {zeroDisplay: '--', precision: 2}),
    numberCase('zeroDisplay, ledger, colorSpec', {
        zeroDisplay: '--',
        ledger: true,
        colorSpec: true,
        precision: 2
    }),
    numberCase('strictZero: false', {
        strictZero: false,
        ledger: true,
        colorSpec: true,
        precision: 0
    }),
    numberCase('prefix', {prefix: '$', precision: 2}),
    numberCase('prefix, label, ledger', {prefix: '$', label: 'k', ledger: true, precision: 1}),
    numberCase('thousands', {label: true, precision: 1}, thousandsRenderer, thousandsTextRenderer),
    numberCase('millions', {label: true, precision: 1}, millionsRenderer, millionsTextRenderer),
    numberCase('billions', {label: true, precision: 3}, billionsRenderer, billionsTextRenderer),
    quantityCase('quantity', {}),
    quantityCase('useMillions: false', {useMillions: false}),
    quantityCase('useBillions: false', {useBillions: false}),
    quantityCase('lossless', {lossless: true}),
    numberCase('price', {}, priceRenderer, priceTextRenderer),
    numberCase('percent', {colorSpec: true}, percentRenderer, percentTextRenderer)
];

//------------------
// Implementation
//------------------
function specCase(
    name: string,
    field: ParityField,
    spec: ColumnSpec,
    renderer: ColumnRenderer
): ParityCase {
    return {name, field, renderer: {...spec, renderer}, textRenderer: spec};
}

function numberCase<O extends NumberTextRendererOptions>(
    name: string,
    opts: O,
    rendererFactory: (opts: O) => ColumnRenderer = numberRenderer,
    textRendererFactory: (opts: O) => ColumnTextRenderer = numberTextRenderer
): ParityCase {
    return {
        name,
        field: 'num',
        renderer: {...number, renderer: rendererFactory(opts)},
        textRenderer: {...number, textRenderer: textRendererFactory(opts)}
    };
}

function quantityCase(name: string, opts: QuantityTextRendererOptions): ParityCase {
    return numberCase<QuantityTextRendererOptions>(
        name,
        opts,
        quantityRenderer,
        quantityTextRenderer
    );
}
