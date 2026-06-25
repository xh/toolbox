import {HoistModel, XH} from '@xh/hoist/core';
import {ReactElement} from 'react';
import {getSourceIcon} from '../../../core/docs/DocIcons';
import {encodeDocId} from '../../../core/docs/DocUtils';
import {DocEntry} from '../../../core/docs/types';
import {DocService} from '../../../core/svc/DocService';

/** A corpus card on the docs landing. */
export interface CorpusCard {
    source: string;
    label: string;
    tagline: string;
    icon: ReactElement;
    docCount: number;
}

/** One-line taglines for the landing cards (phone-specific copy). */
const TAGLINES: Record<string, string> = {
    'hoist-react': 'TypeScript + React front-end',
    'hoist-core': 'Java + Grails server'
};

/**
 * Model for the mobile Docs landing - the corpus chooser. Surfaces the available libraries as cards
 * and the recently-viewed docs, and routes taps into the drill-down stack / search screen. Reads all
 * data from the shared {@link DocService}; holds no state of its own.
 */
export class DocsLandingModel extends HoistModel {
    private get docService(): DocService {
        return DocService.instance;
    }

    get corpora(): CorpusCard[] {
        const {docService} = this;
        return docService.sourceNames.map(source => ({
            source,
            label: docService.getSourceLabel(source),
            tagline: TAGLINES[source] ?? '',
            icon: getSourceIcon(source),
            docCount: docService.getDocCount(source)
        }));
    }

    get recentDocs(): DocEntry[] {
        return this.docService.recentDocs;
    }

    getSourceLabel(source: string): string {
        return this.docService.getSourceLabel(source);
    }

    /** Push into a corpus's category list. */
    openCorpus(source: string) {
        XH.appendRoute('corpus', {source});
    }

    /** Open the dedicated search screen. */
    openSearch() {
        XH.appendRoute('search');
    }

    /**
     * Open a recently-viewed doc directly in the reader, rebuilding the full browse stack so back
     * climbs corpus -> category -> doc as if the user had drilled in.
     */
    openRecent(entry: DocEntry) {
        XH.navigate('default.docs.corpus.category.doc', {
            source: entry.source,
            categoryId: entry.category,
            docId: encodeDocId(entry.id)
        });
    }
}
