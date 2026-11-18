import {boolCheck} from '@xh/hoist/cmp/grid';
import {numberTextRenderer, percentTextRenderer} from '@xh/hoist/format';
import type {ColumnSpec} from '@xh/hoist/cmp/grid';

const unitColOpts: ColumnSpec = {
    headerName: 'Units',
    align: 'right',
    width: 70,
    textRenderer: numberTextRenderer({precision: 0})
};

const grossColOpts: ColumnSpec = {
    headerName: 'Gross',
    align: 'right',
    width: 100,
    textRenderer: numberTextRenderer({precision: 0})
};

export const projectedUnitsSoldCol: ColumnSpec = {
    ...unitColOpts,
    field: {name: 'projectedUnitsSold', type: 'number'},
    chooserName: 'Projected Units',
    exportName: 'Projected Units'
};

export const actualUnitsSoldCol: ColumnSpec = {
    ...unitColOpts,
    field: {name: 'actualUnitsSold', type: 'number'},
    chooserName: 'Actual Units',
    exportName: 'Actual Units'
};

export const projectedGrossCol: ColumnSpec = {
    ...grossColOpts,
    field: {name: 'projectedGross', type: 'number'},
    chooserName: 'Projected Gross',
    exportName: 'Projected Gross'
};

export const actualGrossCol: ColumnSpec = {
    ...grossColOpts,
    field: {name: 'actualGross', type: 'number'},
    chooserName: 'Actual Gross',
    exportName: 'Actual Gross'
};

export const commissionRateCol: ColumnSpec = {
    field: {name: 'commissionRate', type: 'number'},
    headerName: 'Rate',
    chooserName: 'Commission Rate',
    align: 'right',
    width: 80,
    textRenderer: percentTextRenderer({precision: 0})
};

export const commissionCol: ColumnSpec = {
    field: {name: 'commission', type: 'number'},
    headerName: 'Commission',
    align: 'right',
    width: 110,
    textRenderer: numberTextRenderer({precision: 0, prefix: '$'})
};

export const retainCol: ColumnSpec = {
    ...boolCheck,
    field: {name: 'retain', type: 'bool'},
    width: 70
};
