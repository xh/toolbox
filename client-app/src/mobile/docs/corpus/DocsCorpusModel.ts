import {HoistModel, XH} from '@xh/hoist/core';
import {ReactElement} from 'react';
import {getCategoryIcon} from '../../../core/docs/DocIcons';
import {DocService} from '../../../core/svc/DocService';

/** A category row on the corpus screen. */
export interface CorpusCategory {
    id: string;
    title: string;
    icon: ReactElement;
    docCount: number;
}

/**
 * Model for the corpus category-list screen - level 1 of the docs drill-down. Reads its `source`
 * live from the route so the title, counts, and category list always reflect the active corpus.
 */
export class DocsCorpusModel extends HoistModel {
    private get docService(): DocService {
        return DocService.instance;
    }

    get source(): string {
        return XH.routerState.params.source;
    }

    get label(): string {
        return this.docService.getSourceLabel(this.source);
    }

    get docCount(): number {
        return this.docService.getDocCount(this.source);
    }

    get categoryCount(): number {
        return this.docService.getCategoryCount(this.source);
    }

    get categories(): CorpusCategory[] {
        const {docService, source} = this;
        return docService.getPopulatedCategories(source).map(cat => ({
            id: cat.id,
            title: cat.title,
            icon: getCategoryIcon(cat.id),
            docCount: docService.getDocsByCategory(source, cat.id).length
        }));
    }

    /** Push into a category's document list. */
    openCategory(categoryId: string) {
        XH.appendRoute('category', {categoryId});
    }
}
