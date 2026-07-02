import {HoistService, InitContext, XH} from '@xh/hoist/core';
import {action, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {isEmpty} from 'lodash';
import MiniSearch from 'minisearch';
import {sameDoc} from '../docs/DocUtils';
import {DocCategory, DocEntry, DocSourceInfo} from '../docs/types';

export interface DocSearchResult {
    entry: DocEntry;
    score: number;
    /** A short content excerpt around the first matched term (mobile search results). */
    snippet?: string;
    /** The query terms used, for client-side highlighting. */
    matchedTerms?: string[];
}

/** localStorage key + cap for the mobile "recently viewed" docs list. */
const RECENT_DOCS_KEY = 'docs.recentDocs',
    RECENT_DOCS_MAX = 8;

/**
 * Service providing access to hoist-react and hoist-core documentation content.
 *
 * Fetches a registry of all doc entries and their content from the server-side
 * DocsService API. Maintains a MiniSearch full-text index for ranked search.
 */
export class DocService extends HoistService {
    override telemetryPrefix = 'toolbox.client.docs';

    static instance: DocService;

    @observable indexReady: boolean = false;
    @observable.ref registry: DocEntry[] = [];
    @observable.ref sourceInfo: Record<string, DocSourceInfo> = {};

    /** Most-recently-viewed docs (most recent first), persisted locally - drives the mobile landing. */
    @observable.ref recentDocs: DocEntry[] = [];

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

    /** Total number of docs available for a given source. */
    getDocCount(source: string): number {
        return this.registry.filter(it => it.source === source).length;
    }

    /** Categories for a source that contain at least one doc (in registry order). */
    getPopulatedCategories(source: string): DocCategory[] {
        return this.getCategories(source).filter(
            c => this.getDocsByCategory(source, c.id).length > 0
        );
    }

    /** Number of populated categories for a source. */
    getCategoryCount(source: string): number {
        return this.getPopulatedCategories(source).length;
    }

    /**
     * Record a doc as recently viewed (most recent first, de-duped, capped). Persisted to
     * localStorage so the mobile landing's "Jump back in" row survives reloads. Called from the
     * shared `DocViewModel.navigateToDoc`, so any in-app doc view feeds it.
     */
    @action
    noteRecentlyViewed(entry: DocEntry) {
        const next = [entry, ...this.recentDocs.filter(d => !sameDoc(d, entry))].slice(
            0,
            RECENT_DOCS_MAX
        );
        this.recentDocs = next;
        XH.localStorageService.set(
            RECENT_DOCS_KEY,
            next.map(d => `${d.source}:${d.id}`)
        );
    }

    /**
     * First content line containing any of the given terms, markdown-stripped and clipped - used as
     * the matched-line excerpt on mobile search hits. Reads cached content only (populated once the
     * full-text index has been built); returns null when no content is cached or no line matches.
     */
    getContentSnippet(source: string, docId: string, terms: string[]): string | null {
        const content = this.cache.get(`${source}:${docId}`);
        if (!content || isEmpty(terms)) return null;

        const lowered = terms.map(t => t.toLowerCase()),
            lines = this.stripMarkdown(content).split('\n');
        const hit = lines.find(line => {
            const lc = line.toLowerCase();
            return lowered.some(t => lc.includes(t));
        });
        if (!hit) return null;

        const trimmed = hit.trim();
        if (trimmed.length <= 140) return trimmed;

        // Clip a ~140-char window centered on the first match.
        const idx = lowered.reduce((min, t) => {
            const i = trimmed.toLowerCase().indexOf(t);
            return i >= 0 && (min < 0 || i < min) ? i : min;
        }, -1);
        const start = Math.max(0, idx - 50),
            excerpt = trimmed.slice(start, start + 140).trim();
        return (start > 0 ? '...' : '') + excerpt + '...';
    }

    override async initAsync(ctx: InitContext) {
        await this.loadRegistryAsync();
        this.hydrateRecentDocs();
    }

    /** Restore recently-viewed docs from localStorage, mapping stored ids to live registry entries. */
    @action
    private hydrateRecentDocs() {
        const stored: string[] = XH.localStorageService.get(RECENT_DOCS_KEY, []);
        this.recentDocs = stored
            .map(key => {
                const [source, ...idParts] = key.split(':');
                return this.getDocEntry(idParts.join(':'), source);
            })
            .filter(Boolean);
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

        return this.runner()
            .span('getContent')
            .run(async ctx => {
                const resp = await XH.fetchJson(
                    {
                        url: 'docs/content',
                        params: {source, docId}
                    },
                    ctx
                );
                const content = resp.content;
                this.cache.set(cacheKey, content);
                return content;
            });
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
                boost: {title: 5, keywords: 3, description: 2, content: 1},
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
                const searchable = [doc.title, doc.description, ...doc.keywords]
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
        return this.runner()
            .span('loadRegistry')
            .run(async ctx => {
                const resp = await XH.fetchJson({url: 'docs/registry'}, ctx);
                const sourceCount = Object.keys(resp.sources).length;

                this.logInfo(
                    `Loaded registry: ${resp.entries.length} entries from ${sourceCount} sources`
                );

                runInAction(() => {
                    this.registry = resp.entries.map(e => ({
                        id: e.id,
                        source: e.source,
                        title: e.title,
                        category: e.category,
                        description: e.description,
                        keywords: e.keywords ?? []
                    }));
                    this.sourceInfo = resp.sources;
                });
            });
    }

    private async buildIndexAsync() {
        try {
            this.logDebug('Building full-text search index...');
            const entries = this.registry,
                contents = await Promise.all(
                    entries.map(entry =>
                        this.fetchContentAsync(entry.source, entry.id).catch(() => '')
                    )
                );

            const index = new MiniSearch({
                fields: ['title', 'keywords', 'description', 'content'],
                storeFields: []
            });

            const documents = entries.map((entry, i) => ({
                id: `${entry.source}:${entry.id}`,
                title: entry.title,
                keywords: entry.keywords.join(' '),
                description: entry.description,
                content: this.stripMarkdown(contents[i])
            }));

            index.addAll(documents);
            this.index = index;
            runInAction(() => (this.indexReady = true));
            this.logInfo(`Search index built: ${documents.length} documents indexed`);
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
