import {boolCheckCol} from '@xh/hoist/cmp/grid';
import {numberRenderer} from '@xh/hoist/format';
import {ColumnSpec} from '@xh/hoist/cmp/grid';

const unitColOpts = {
    headerName: 'Units',
    align: 'right',
    width: 70,
    renderer: numberRenderer({precision: 0})
} as ColumnSpec;

const grossColOpts = {
    headerName: 'Gross',
    align: 'right',
    width: 100,
    renderer: numberRenderer({precision: 0})
} as ColumnSpec;

export const projectedUnitsSoldCol = {
    ...unitColOpts,
    field: {name: 'projectedUnitsSold', type: 'number'},
    chooserName: 'Projected Units',
    exportName: 'Projected Units'
} as ColumnSpec;

export const actualUnitsSoldCol = {
    ...unitColOpts,
    field: {name: 'actualUnitsSold', type: 'number'},
    chooserName: 'Actual Units',
    exportName: 'Actual Units'
} as ColumnSpec;

export const projectedGrossCol = {
    ...grossColOpts,
    field: {name: 'projectedGross', type: 'number'},
    chooserName: 'Projected Gross',
    exportName: 'Projected Gross'
} as ColumnSpec;

export const actualGrossCol = {
    ...grossColOpts,
    field: {name: 'actualGross', type: 'number'},
    chooserName: 'Actual Gross',
    exportName: 'Actual Gross'
} as ColumnSpec;

export const retainCol = {
    ...boolCheckCol,
    field: {name: 'retain', type: 'bool'},
    width: 70
} as ColumnSpec;