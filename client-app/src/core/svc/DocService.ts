import {HoistService, XH} from '@xh/hoist/core';
import {makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import MiniSearch from 'minisearch';
import {DOC_REGISTRY, DocEntry, getDocEntry} from '../../desktop/tabs/docs/docRegistry';

export interface DocSearchResult {
    entry: DocEntry;
    score: number;
}

/**
 * Service providing access to hoist-react documentation content.
 *
 * Markdown files are emitted to the build output by webpack's file-loader at build time.
 * This service fetches their content on demand and caches it for the session.
 *
 * Also maintains a MiniSearch full-text index across all doc content for ranked search.
 */
export class DocService extends HoistService {
    static instance: DocService;

    @observable indexReady: boolean = false;

    private cache: Map<string, string> = new Map();
    private index: MiniSearch;

    constructor() {
        super();
        makeObservable(this);
    }

    /** All registered documentation entries. */
    get docs(): DocEntry[] {
        return DOC_REGISTRY;
    }

    override async initAsync() {
        // Fire-and-forget — don't block app load while pre-fetching all doc content.
        this.buildIndexAsync();
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
     * Search docs by query string. Uses MiniSearch full-text index when ready,
     * falls back to simple substring matching otherwise.
     */
    searchDocs(query: string): DocSearchResult[] {
        if (!query?.trim()) return [];

        if (this.indexReady) {
            const results = this.index.search(query, {
                boost: {title: 5, keyTopics: 3, description: 2, content: 1},
                prefix: true,
                fuzzy: 0.2,
                combineWith: 'AND'
            });
            return results
                .map(r => ({
                    entry: getDocEntry(r.id as string),
                    score: r.score
                }))
                .filter(r => r.entry != null);
        }

        // Fallback: simple substring matching before index is ready.
        const terms = query.toLowerCase().split(/\s+/);
        return DOC_REGISTRY.filter(doc => {
            const searchable = [doc.title, doc.description, ...doc.keyTopics]
                .join(' ')
                .toLowerCase();
            return terms.every(term => searchable.includes(term));
        }).map(entry => ({entry, score: 1}));
    }

    //------------------
    // Implementation
    //------------------
    private async buildIndexAsync() {
        try {
            // Pre-fetch all doc content in parallel.
            const entries = DOC_REGISTRY,
                contents = await Promise.all(
                    entries.map(entry => this.fetchContentAsync(entry.id).catch(() => ''))
                );

            // Build the MiniSearch index.
            const index = new MiniSearch({
                fields: ['title', 'keyTopics', 'description', 'content'],
                storeFields: [],
                searchOptions: {
                    boost: {title: 5, keyTopics: 3, description: 2, content: 1},
                    prefix: true,
                    fuzzy: 0.2,
                    combineWith: 'AND'
                }
            });

            const documents = entries.map((entry, i) => ({
                id: entry.id,
                title: entry.title,
                keyTopics: entry.keyTopics.join(' '),
                description: entry.description,
                content: this.stripMarkdown(contents[i])
            }));

            index.addAll(documents);
            this.index = index;
            runInAction(() => (this.indexReady = true));
        } catch (e) {
            XH.handleException(e, {showAlert: false, logOnServer: false});
        }
    }

    /** Strip markdown syntax to produce plain text for indexing. */
    private stripMarkdown(md: string): string {
        return md
            .replace(/```\w*\n([\s\S]*?)```/g, '$1') // fenced code blocks — keep content, strip delimiters
            .replace(/`([^`]*)`/g, '$1') // inline code — keep content, strip backticks
            .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images
            .replace(/#{1,6}\s+/g, '') // headings
            .replace(/[*_~]{1,3}/g, '') // bold/italic/strikethrough
            .replace(/^\s*[-*+]\s+/gm, '') // unordered list markers
            .replace(/^\s*\d+\.\s+/gm, '') // ordered list markers
            .replace(/^\s*>\s+/gm, '') // blockquotes
            .replace(/\|/g, ' ') // table pipes
            .replace(/---+/g, '') // horizontal rules
            .replace(/\n{2,}/g, '\n') // collapse multiple newlines
            .trim();
    }
}
