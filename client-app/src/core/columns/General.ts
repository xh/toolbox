import {boolCheckCol} from '@xh/hoist/cmp/grid';
import {ColumnSpec} from '@xh/hoist/cmp/grid';

export const nameCol: ColumnSpec = {
    field: {name: 'name', type: 'string'},
    headerName: 'Name',
    minWidth: 180,
    width: 200
};

export const activeCol: ColumnSpec = {
    ...boolCheckCol,
    field: {name: 'active', type: 'bool'},
    headerName: '',
    chooserName: 'Active Status'
};
