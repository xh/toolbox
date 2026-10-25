import type {FilterMatchMode} from '@xh/hoist/data';

/** Select options for the `matchMode` prop shared by StoreFilterField and GridFindField. */
export const MATCH_MODE_OPTIONS: Array<{value: FilterMatchMode; label: string}> = [
    {value: 'startWord', label: 'Start of word'},
    {value: 'start', label: 'Start'},
    {value: 'any', label: 'Any'}
];
