import {StoreRecordId} from '@xh/hoist/data';
import {PlainObject} from '@xh/hoist/core';

export interface FilterSelectQuery {
    testId: string;
    filterText: string;
    selectionText?: string;
    asyncOptionUrl?: string;
}

/**
 * Query for a StoreRecord by either ID or a partial match on record data.
 */
export type RecordQuery = StoreRecordId | PlainObject;
