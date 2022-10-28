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
    field: {name: 'projectedUnitsSold', type: 'number'},
    chooserName: 'Projected Units',
    exportName: 'Projected Units',
    ...unitColOpts
} as ColumnSpec;

export const actualUnitsSoldCol = {
    field: {name: 'actualUnitsSold', type: 'number'},
    chooserName: 'Actual Units',
    exportName: 'Actual Units',
    ...unitColOpts
} as ColumnSpec;

export const projectedGrossCol = {
    field: {name: 'projectedGross', type: 'number'},
    chooserName: 'Projected Gross',
    exportName: 'Projected Gross',
    ...grossColOpts
} as ColumnSpec;

export const actualGrossCol = {
    field: {name: 'actualGross', type: 'number'},
    chooserName: 'Actual Gross',
    exportName: 'Actual Gross',
    ...grossColOpts
} as ColumnSpec;

export const retainCol = {
    field: {name: 'retain', type: 'boolean'},
    ...boolCheckCol,
    width: 70
} as ColumnSpec;