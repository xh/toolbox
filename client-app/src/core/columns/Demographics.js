import {FieldType} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';

const {NUMBER, STRING} = FieldType;

// Note: This column does not have a field, it is calculated from firstName and lastName
export const fullNameCol = {
    colId: 'fullName',
    headerName: 'Name',
    width: 140,
    rendererIsComplex: true,
    renderer: (v, {record}) => record ? `${record.data.firstName} ${record.data.lastName}` : ''
};

export const firstNameCol = {
    field: {name: 'firstName', type: STRING},
    headerName: 'First',
    width: 100
};

export const lastNameCol = {
    field: {name: 'lastName', type: STRING},
    headerName: 'Last',
    width: 100
};

export const companyCol = {
    field: {name: 'company', type: STRING},
    flex: 1,
    minWidth: 200
};

export const cityCol = {
    field: {name: 'city', type: STRING},
    minWidth: 150,
    maxWidth: 200
};

export const stateCol = {
    field: {name: 'state', type: STRING},
    width: 120
};

export const salaryCol = {
    field: {name: 'salary', type: NUMBER},
    width: 90,
    align: 'right',
    renderer: numberRenderer({precision: 0, prefix: '$'})
};

export const locationCol = {
    field: {name: 'location', type: STRING}
};

export const emailCol = {
    field: {name: 'email', type: STRING}
};

export const cellPhoneCol = {
    field: {name: 'cellPhone', type: STRING}
};

export const workPhoneCol = {
    field: {name: 'workPhone', type: STRING}
};
