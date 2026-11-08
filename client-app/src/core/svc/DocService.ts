import type {InitContext} from '@xh/hoist/core';
import {HoistService, XH} from '@xh/hoist/core';
import {action, observableRef, runInAction} from '@xh/hoist/mobx';
import {isEmpty} from 'lodash';
import {sameDoc} from '../docs/DocUtils';
import type {DocCategory, DocEntry, DocSourceInfo} from '../docs/types';

export interface DocSearchResult {
    entry: DocEntry;
    score: number;
    /** Section of the doc that matched best, as a `section` path for the reader. */
    section?: string;
    /** A short excerpt from the start of the best-matching section. */
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
 * Toolbox's server reads docs from the Hoist Docs service, which holds versioned indexes of each
 * library and the same ranked search AI agents use over MCP. This service fetches the registry,
 * content, and search results from that API, at the library versions chosen in
 * {@link selectedVersions} (newest by default).
 */
export class DocService extends HoistService {
    override telemetryPrefix = 'toolbox.client.docs';

    static instance: DocService;

    @observableRef accessor registry: DocEntry[] = [];
    @observableRef accessor sourceInfo: Record<string, DocSourceInfo> = {};

    /** Version chosen per source, e.g. `{'hoist-react': '86.2.0'}`. Absent means newest. */
    @observableRef accessor selectedVersions: Record<string, string> = {};

    /** Most-recently-viewed docs (most recent first), persisted locally - drives the mobile landing. */
    @observableRef accessor recentDocs: DocEntry[] = [];

    private cache: Map<string, string> = new Map();

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

    override async initAsync(ctx: InitContext) {
        await this.loadRegistryAsync();
        this.hydrateRecentDocs();
    }

    /** Switch one source to another version, reloading the registry and dropping cached content. */
    async setVersionAsync(source: string, version: string) {
        runInAction(() => (this.selectedVersions = {...this.selectedVersions, [source]: version}));
        this.cache.clear();
        await this.loadRegistryAsync();
    }

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
                        params: {source, docId, ...this.selectedVersions}
                    },
                    ctx
                );
                const content = resp.content;
                this.cache.set(cacheKey, content);
                return content;
            });
    }

    /**
     * Search docs by query string, ranked by the Hoist Docs service. Each doc appears once, with
     * the section that matched best and an excerpt from it.
     */
    async searchDocsAsync(query: string): Promise<DocSearchResult[]> {
        if (!query?.trim()) return [];

        const resp = await this.runner()
                .span('search')
                .run(ctx =>
                    XH.fetchJson(
                        {url: 'docs/search', params: {query, ...this.selectedVersions}},
                        ctx
                    )
                ),
            matchedTerms = query
                .toLowerCase()
                .split(/\s+/)
                .filter(t => t.length > 1);

        return (resp.results ?? [])
            .map(r => ({
                entry: this.getDocEntry(r.id, r.source),
                score: r.score,
                section: r.section,
                snippet: isEmpty(r.snippet) ? null : r.snippet,
                matchedTerms
            }))
            .filter(r => r.entry != null);
    }

    //------------------
    // Implementation
    //------------------
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

    private async loadRegistryAsync() {
        return this.runner()
            .span('loadRegistry')
            .run(async ctx => {
                const resp = await XH.fetchJson(
                    {
                        url: 'docs/registry',
                        params: isEmpty(this.selectedVersions) ? null : this.selectedVersions
                    },
                    ctx
                );
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
}
