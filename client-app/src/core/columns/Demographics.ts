import {numberRenderer} from '@xh/hoist/format';
import {ColumnSpec, ColumnRenderer} from '@xh/hoist/cmp/grid';

const fullNameRenderer: ColumnRenderer = (v, {record}) =>
    record ? `${record.data.firstName} ${record.data.lastName}` : '';

// Note: This column does not have a field, it is calculated from firstName and lastName
export const fullNameCol: ColumnSpec = {
    colId: 'fullName',
    headerName: 'Name',
    width: 140,
    rendererIsComplex: true,
    renderer: fullNameRenderer,
    exportValue: fullNameRenderer
};

export const firstNameCol: ColumnSpec = {
    field: {name: 'firstName', type: 'string'},
    headerName: 'First',
    width: 100
};

export const lastNameCol: ColumnSpec = {
    field: {name: 'lastName', type: 'string'},
    headerName: 'Last',
    width: 100
};

export const companyCol: ColumnSpec = {
    field: {name: 'company', type: 'string'},
    flex: 1,
    minWidth: 200
};

export const cityCol: ColumnSpec = {
    field: {name: 'city', type: 'string'},
    minWidth: 150,
    maxWidth: 200
};

export const stateCol: ColumnSpec = {
    field: {name: 'state', type: 'string'},
    width: 120
};

export const salaryCol: ColumnSpec = {
    field: {name: 'salary', type: 'number'},
    width: 90,
    align: 'right',
    renderer: numberRenderer({precision: 0, prefix: '$'})
};

export const locationCol: ColumnSpec = {
    field: {name: 'location', type: 'string'}
};

export const emailCol: ColumnSpec = {
    field: {name: 'email', type: 'string'}
};

export const cellPhoneCol: ColumnSpec = {
    field: {name: 'cellPhone', type: 'string'}
};

export const workPhoneCol: ColumnSpec = {
    field: {name: 'workPhone', type: 'string'}
};
