import {HoistService, XH} from '@xh/hoist/core';
import {DOC_REGISTRY, DocEntry, getDocEntry} from './docRegistry';

/**
 * Service providing access to hoist-react documentation content.
 *
 * Markdown files are emitted to the build output by webpack's file-loader at build time.
 * This service fetches their content on demand and caches it for the session.
 */
export class DocService extends HoistService {
    static instance: DocService;

    private cache: Map<string, string> = new Map();

    /** All registered documentation entries. */
    get docs(): DocEntry[] {
        return DOC_REGISTRY;
    }

    /**
     * Fetch and return the markdown content for a given doc ID.
     * Results are cached after the first fetch.
     */
    async fetchContentAsync(docId: string): Promise<string> {
        const cached = this.cache.get(docId);
        if (cached) return cached;

        const entry = getDocEntry(docId);
        if (!entry) {
            throw XH.exception(`Unknown doc ID: ${docId}`);
        }

        const response = await fetch(entry.url);
        if (!response.ok) {
            throw XH.exception(`Failed to load doc "${entry.title}": ${response.statusText}`);
        }

        const content = await response.text();
        this.cache.set(docId, content);
        return content;
    }

    /**
     * Search docs by query string, matching against title, description, and key topics.
     * Returns matching DocEntry objects, scored by relevance.
     */
    searchDocs(query: string): DocEntry[] {
        if (!query?.trim()) return DOC_REGISTRY;

        const terms = query.toLowerCase().split(/\s+/);
        return DOC_REGISTRY.filter(doc => {
            const searchable = [doc.title, doc.description, ...doc.keyTopics]
                .join(' ')
                .toLowerCase();
            return terms.every(term => searchable.includes(term));
        });
    }
}
