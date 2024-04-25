import {boolCheckCol} from '@xh/hoist/cmp/grid';
import {numberRenderer} from '@xh/hoist/format';
import {ColumnSpec} from '@xh/hoist/cmp/grid';

const unitColOpts: ColumnSpec = {
    headerName: 'Units',
    align: 'right',
    width: 70,
    renderer: numberRenderer({precision: 0})
};

const grossColOpts: ColumnSpec = {
    headerName: 'Gross',
    align: 'right',
    width: 100,
    renderer: numberRenderer({precision: 0})
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

export const retainCol: ColumnSpec = {
    ...boolCheckCol,
    field: {name: 'retain', type: 'bool'},
    width: 70
};
