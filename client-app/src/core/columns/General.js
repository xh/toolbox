import {FieldType} from '@xh/hoist/data';
import {boolCheckCol} from '@xh/hoist/cmp/grid';

const {STRING, BOOL} = FieldType;

export const nameCol = {
    field: {name: 'name', type: STRING},
    headerName: 'Name',
    minWidth: 180,
    width: 200
};

export const activeCol = {
    field: {name: 'active', type: BOOL},
    ...boolCheckCol,
    headerName: '',
    chooserName: 'Active Status'
};