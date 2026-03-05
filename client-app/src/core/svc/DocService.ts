import {HoistService, XH} from '@xh/hoist/core';
import {makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import MiniSearch from 'minisearch';
import {DocCategory, DocEntry, DocSourceInfo} from '../../desktop/tabs/docs/docRegistry';

export interface DocSearchResult {
    entry: DocEntry;
    score: number;
}

/**
 * Service providing access to hoist-react and hoist-core documentation content.
 *
 * Fetches a registry of all doc entries and their content from the server-side
 * DocsService API. Maintains a MiniSearch full-text index for ranked search.
 */
export class DocService extends HoistService {
    static instance: DocService;

    @observable indexReady: boolean = false;
    @observable.ref registry: DocEntry[] = [];
    @observable.ref sourceInfo: Record<string, DocSourceInfo> = {};

    private cache: Map<string, string> = new Map();
    private index: MiniSearch;

    constructor() {
        super();
        makeObservable(this);
    }

    /** All registered documentation entries. */
    get docs(): DocEntry[] {
        return this.registry;
    }

    /** Get categories for a given source. */
    getCategories(source: string): DocCategory[] {
        return this.sourceInfo[source]?.categories ?? [];
    }

    /** Get all categories across all sources. */
    get allCategories(): DocCategory[] {
        return Object.values(this.sourceInfo).flatMap(s => s.categories);
    }

    /** Get the display label for a source (e.g. 'Hoist React'). */
    getSourceLabel(source: string): string {
        return this.sourceInfo[source]?.label ?? source;
    }

    /** Get unique source names present in the registry. */
    get sourceNames(): string[] {
        return [...new Set(this.registry.map(d => d.source))];
    }

    /** Find a doc entry by ID, optionally scoped to a source. */
    getDocEntry(id: string, source?: string): DocEntry | undefined {
        return source
            ? this.registry.find(it => it.id === id && it.source === source)
            : this.registry.find(it => it.id === id);
    }

    /** Get all doc entries for a given source + category. */
    getDocsByCategory(source: string, categoryId: string): DocEntry[] {
        return this.registry.filter(it => it.source === source && it.category === categoryId);
    }

    override async initAsync() {
        await this.loadRegistryAsync();
    }

    /** Kick off full-text index build. Called lazily on first search request. */
    ensureIndexBuilt() {
        if (!this.indexReady && !this._indexBuilding) {
            this._indexBuilding = true;
            this.buildIndexAsync();
        }
    }

    private _indexBuilding = false;

    /**
     * Fetch and return the markdown content for a given doc entry.
     * Results are cached after the first fetch.
     */
    async fetchContentAsync(source: string, docId: string): Promise<string> {
        const cacheKey = `${source}:${docId}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const resp = await XH.fetchJson({
            url: 'docs/content',
            params: {source, docId}
        });

        const content = resp.content;
        this.cache.set(cacheKey, content);
        return content;
    }

    /**
     * Search docs by query string. Uses MiniSearch full-text index when ready,
     * falls back to simple substring matching otherwise.
     */
    searchDocs(query: string): DocSearchResult[] {
        if (!query?.trim()) return [];
        this.ensureIndexBuilt();

        if (this.indexReady) {
            const results = this.index.search(query, {
                boost: {title: 5, keyTopics: 3, description: 2, content: 1},
                prefix: term => term.length >= 4,
                fuzzy: term => (term.length >= 6 ? 0.15 : false),
                combineWith: 'AND'
            });
            return results
                .map(r => {
                    const [source, id] = (r.id as string).split(':');
                    return {
                        entry: this.getDocEntry(id, source),
                        score: r.score
                    };
                })
                .filter(r => r.entry != null);
        }

        // Fallback: simple substring matching before index is ready.
        const terms = query.toLowerCase().split(/\s+/);
        return this.registry
            .filter(doc => {
                const searchable = [doc.title, doc.description, ...doc.keyTopics]
                    .join(' ')
                    .toLowerCase();
                return terms.every(term => searchable.includes(term));
            })
            .map(entry => ({entry, score: 1}));
    }

    //------------------
    // Implementation
    //------------------
    private async loadRegistryAsync() {
        const resp = await XH.fetchJson({url: 'docs/registry'});

        runInAction(() => {
            this.registry = resp.entries.map(e => ({
                id: e.id,
                source: e.source,
                title: e.title,
                category: e.category,
                description: e.description,
                keyTopics: e.keyTopics ?? []
            }));
            this.sourceInfo = resp.sources;
        });
    }

    private async buildIndexAsync() {
        try {
            const entries = this.registry,
                contents = await Promise.all(
                    entries.map(entry =>
                        this.fetchContentAsync(entry.source, entry.id).catch(() => '')
                    )
                );

            const index = new MiniSearch({
                fields: ['title', 'keyTopics', 'description', 'content'],
                storeFields: []
            });

            const documents = entries.map((entry, i) => ({
                id: `${entry.source}:${entry.id}`,
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
            .replace(/```\w*\n([\s\S]*?)```/g, '$1')
            .replace(/`([^`]*)`/g, '$1')
            .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/#{1,6}\s+/g, '')
            .replace(/[*_~]{1,3}/g, '')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/^\s*>\s+/gm, '')
            .replace(/\|/g, ' ')
            .replace(/---+/g, '')
            .replace(/\n{2,}/g, '\n')
            .trim();
    }
}
