import {FieldType} from '@xh/hoist/data';
import {boolCheckCol} from '@xh/hoist/cmp/grid';

export const nameCol = {
    field: {
        name: 'name',
        type: FieldType.STRING
    },
    headerName: 'Name',
    minWidth: 180,
    width: 200
};

export const activeCol = {
    field: {
        name: 'active',
        type: FieldType.BOOL
    },
    ...boolCheckCol,
    headerName: '',
    chooserName: 'Active Status'
};