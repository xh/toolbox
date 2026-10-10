import {ExcelFormat, localDate, tags} from '@xh/hoist/cmp/grid';
import {hbox, vbox} from '@xh/hoist/cmp/layout';
import {
    dateFormatter,
    dateRenderer,
    fmtNumberTooltip,
    millionsFormatter,
    millionsRenderer,
    numberFormatter,
    numberRenderer
} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import type {ColumnRenderer, ColumnSpec} from '@xh/hoist/cmp/grid';
import type {NumberFormatterOptions} from '@xh/hoist/format';

// Format options for the P&L and Volume columns, shared by their formatters and the matching
// renderers below.
export const PNL_FORMAT: NumberFormatterOptions = {precision: 0, ledger: true, colorSpec: true},
    VOLUME_FORMAT: NumberFormatterOptions = {precision: 1, label: true};

export const profitLossCol: ColumnSpec = {
    field: {
        name: 'profit_loss',
        type: 'number',
        displayName: 'P&L',
        description: 'Annual Profit & Loss YTD (EBITDA)'
    },
    width: 130,
    align: 'right',
    absSort: true,
    tooltip: val => fmtNumberTooltip(val, {ledger: true}),
    formatter: numberFormatter(PNL_FORMAT),
    excelFormat: ExcelFormat.LEDGER_COLOR
};

export const winLoseCol: ColumnSpec = {
    field: {name: 'winLose', type: 'string'},
    excludeFromChooser: true
};

// Demos Column.cellFlag - flags unusually high volume without disturbing the cell's contents.
// A single predicate drives both the flag and its tooltip, so the two cannot drift apart.
const HIGH_VOLUME = 9000000000,
    isHighVolume = (volume: number) => volume >= HIGH_VOLUME;

export const tradeVolumeCol: ColumnSpec = {
    field: {
        name: 'trade_volume',
        type: 'number',
        displayName: 'Volume',
        description: 'Daily Volume of Shares (Estimated, avg. YTD)'
    },
    width: 110,
    align: 'right',
    // Explains the flag. Hoist frames only string tooltips, so this custom element tooltip opts
    // into the standard frame with `xh-grid-tooltip-frame`.
    tooltip: volume =>
        isHighVolume(volume)
            ? vbox({
                  className: 'xh-grid-tooltip-frame',
                  items: [
                      fmtNumberTooltip(volume),
                      hbox({
                          className: 'tb-flag-tooltip__note',
                          alignItems: 'center',
                          items: [
                              Icon.warning({intent: 'warning'}),
                              'Unusually high volume - review before trading.'
                          ]
                      })
                  ]
              })
            : fmtNumberTooltip(volume),
    formatter: millionsFormatter(VOLUME_FORMAT),
    cellFlag: volume => (isHighVolume(volume) ? 'warning' : null),
    excelFormat: ExcelFormat.NUM_DELIMITED
};

export const tradeDateCol: ColumnSpec = {
    ...localDate,
    field: {
        name: 'trade_date',
        type: 'localDate',
        displayName: 'Date',
        description: 'Date of last trade (including related derivatives)'
    }
};

// Renderers with the same options as the formatters on the trade columns above. A renderer wins
// over a formatter, so `{...profitLossCol, renderer: profitLossRenderer}` gives the column a React
// component per cell in place of plain text. The Standard grid demo switches between the two.
export const profitLossRenderer: ColumnRenderer = numberRenderer(PNL_FORMAT),
    tradeVolumeRenderer: ColumnRenderer = millionsRenderer(VOLUME_FORMAT),
    tradeDateRenderer: ColumnRenderer = dateRenderer();

export const tagsCol: ColumnSpec = {
    ...tags,
    field: {
        name: 'tags',
        type: 'tags',
        displayName: 'Tags'
    },
    width: 210,
    chooserDescription: 'Tags associated with this trade'
};

export const dayOfWeekCol: ColumnSpec = {
    field: {
        name: 'trade_date',
        type: 'localDate',
        // The grid's store takes this field from the first column that uses it, which can be this
        // one. Name it as `tradeDateCol` does, so this column's own displayName does not leak.
        displayName: 'Date'
    },
    colId: 'dayOfWeek',
    displayName: 'Day of Week',
    chooserDescription: 'Used for testing storeFilterField matching on rendered dates.',
    width: 130,
    formatter: dateFormatter({fmt: 'dddd'})
};
