import {FieldType} from '@xh/hoist/data';
import {boolCheckCol} from '@xh/hoist/cmp/grid';
import {numberRenderer} from '@xh/hoist/format';

const {BOOL, NUMBER} = FieldType;

const unitColOpts = {
    headerName: 'Units',
    align: 'right',
    width: 70,
    renderer: numberRenderer({precision: 0})
};

const grossColOpts = {
    headerName: 'Gross',
    align: 'right',
    width: 100,
    renderer: numberRenderer({precision: 0})
};

export const projectedUnitsSoldCol = {
    field: {name: 'projectedUnitsSold', type: NUMBER},
    chooserName: 'Projected Units',
    exportName: 'Projected Units',
    ...unitColOpts
};

export const actualUnitsSoldCol = {
    field: {name: 'actualUnitsSold', type: NUMBER},
    chooserName: 'Actual Units',
    exportName: 'Actual Units',
    ...unitColOpts
};

export const projectedGrossCol = {
    field: {name: 'projectedGross', type: NUMBER},
    chooserName: 'Projected Gross',
    exportName: 'Projected Gross',
    ...grossColOpts
};

export const actualGrossCol = {
    field: {name: 'actualGross', type: NUMBER},
    chooserName: 'Actual Gross',
    exportName: 'Actual Gross',
    ...grossColOpts
};

export const retainCol = {
    field: {name: 'retain', type: BOOL},
    ...boolCheckCol,
    width: 70
};