import {HoistModel, XH} from '@xh/hoist/core';
import {encodeDocId} from '../../../core/docs/DocUtils';
import {DocCategory, DocEntry} from '../../../core/docs/types';
import {DocService} from '../../../core/svc/DocService';

/**
 * Model for the category document-list screen - level 2 of the docs drill-down. Reads `source` and
 * `categoryId` live from the route; lists that category's docs and pushes the reader on tap.
 */
export class DocsCategoryModel extends HoistModel {
    private get docService(): DocService {
        return DocService.instance;
    }

    get source(): string {
        return XH.routerState.params.source;
    }

    get categoryId(): string {
        return XH.routerState.params.categoryId;
    }

    get category(): DocCategory | null {
        return (
            this.docService.getCategories(this.source).find(c => c.id === this.categoryId) ?? null
        );
    }

    get docs(): DocEntry[] {
        return this.docService.getDocsByCategory(this.source, this.categoryId);
    }

    /** Push the reader for the given doc (source + categoryId already on the route). */
    openDoc(entry: DocEntry) {
        XH.appendRoute('doc', {docId: encodeDocId(entry.id)});
    }
}
