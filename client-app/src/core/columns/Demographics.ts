import {numberRenderer} from '@xh/hoist/format';
import {ColumnSpec, ColumnRenderer} from '@xh/hoist/cmp/grid';

const fullNameRenderer: ColumnRenderer = (v, {record}) => record ? `${record.data.firstName} ${record.data.lastName}` : '';

// Note: This column does not have a field, it is calculated from firstName and lastName
export const fullNameCol = {
    colId: 'fullName',
    headerName: 'Name',
    width: 140,
    rendererIsComplex: true,
    renderer: fullNameRenderer,
    exportValue: fullNameRenderer
} as ColumnSpec;

export const firstNameCol = {
    field: {name: 'firstName', type: 'string'},
    headerName: 'First',
    width: 100
} as ColumnSpec;

export const lastNameCol = {
    field: {name: 'lastName', type: 'string'},
    headerName: 'Last',
    width: 100
} as ColumnSpec;

export const companyCol = {
    field: {name: 'company', type: 'string'},
    flex: 1,
    minWidth: 200
} as ColumnSpec;

export const cityCol = {
    field: {name: 'city', type: 'string'},
    minWidth: 150,
    maxWidth: 200
} as ColumnSpec;

export const stateCol = {
    field: {name: 'state', type: 'string'},
    width: 120
} as ColumnSpec;

export const salaryCol = {
    field: {name: 'salary', type: 'number'},
    width: 90,
    align: 'right',
    renderer: numberRenderer({precision: 0, prefix: '$'})
} as ColumnSpec;

export const locationCol = {
    field: {name: 'location', type: 'string'}
} as ColumnSpec;

export const emailCol = {
    field: {name: 'email', type: 'string'}
} as ColumnSpec;

export const cellPhoneCol = {
    field: {name: 'cellPhone', type: 'string'}
} as ColumnSpec;

export const workPhoneCol = {
    field: {name: 'workPhone', type: 'string'}
} as ColumnSpec;