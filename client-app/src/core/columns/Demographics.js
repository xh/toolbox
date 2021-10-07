import {FieldType} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';

// Note: This column does not have a field, it is calculated from firstName and lastName
export const fullNameCol = {
    colId: 'fullName',
    headerName: 'Name',
    width: 140,
    chooserName: 'Full Name',
    rendererIsComplex: true,
    renderer: (v, {record}) => record ? `${record.data.firstName} ${record.data.lastName}` : ''
};

export const firstNameCol = {
    field: {
        name: 'firstName',
        type: FieldType.STRING
    },
    headerName: 'First',
    width: 100,
    chooserName: 'First Name'
};

export const lastNameCol = {
    field: {
        name: 'lastName',
        type: FieldType.STRING
    },
    headerName: 'Last',
    width: 100,
    chooserName: 'Last Name'
};

export const companyCol = {
    field: {
        name: 'company',
        type: FieldType.STRING
    },
    flex: 1,
    minWidth: 200
};

export const cityCol = {
    field: {
        name: 'city',
        type: FieldType.STRING
    },
    minWidth: 150,
    maxWidth: 200
};

export const stateCol = {
    field: {
        name: 'state',
        type: FieldType.STRING
    },
    width: 120
};

export const salaryCol = {
    field: {
        name: 'salary',
        type: FieldType.NUMBER
    },
    width: 90,
    align: 'right',
    renderer: numberRenderer({precision: 0, prefix: '$'})
};

export const locationCol = {
    field: {
        name: 'location',
        type: FieldType.STRING
    }
};

export const emailCol = {
    field: {
        name: 'email',
        type: FieldType.STRING
    }
};

export const cellPhoneCol = {
    field: {
        name: 'cellPhone',
        type: FieldType.STRING
    }
};

export const workPhoneCol = {
    field: {
        name: 'workPhone',
        type: FieldType.STRING
    }
};