import {FieldType} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {dateTimeCol} from '@xh/hoist/cmp/grid';

const {DATE, NUMBER, STRING} = FieldType;

export const symbolCol = {
    field: {
        name: 'symbol',
        type: STRING,
        displayName: 'Instrument'
    },
    width: 100
};

export const traderCol = {
    field: {name: 'trader', type: STRING},
    width: 140
};

export const fundCol = {
    field: {name: 'fund', type: STRING},
    width: 160
};

export const modelCol = {
    field: {name: 'model', type: STRING},
    width: 160
};

export const regionCol = {
    field: {name: 'region', type: STRING},
    width: 160
};

export const sectorCol = {
    field: {name: 'sector', type: STRING},
    width: 160
};

export const dirCol = {
    field: {
        name: 'dir',
        type: STRING,
        displayName: 'Direction'
    },
    headerName: 'B/S',
    headerTooltip: 'Direction (Buy/Sell)',
    align: 'center',
    width: 60
};

export const quantityCol = {
    field: {name: 'quantity', type: NUMBER},
    width: 100,
    renderer: numberRenderer({precision: 0, ledger: true})
};

export const priceCol = {
    field: {name: 'price', type: NUMBER},
    width: 80,
    renderer: numberRenderer({precision: 2})
};

export const timeCol = {
    field: {
        name: 'time',
        type: DATE,
        displayName: 'Exec Time'
    },
    ...dateTimeCol,
    align: 'left'
};