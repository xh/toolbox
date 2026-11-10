import type {InitContext} from '@xh/hoist/core';
import {HoistService, XH} from '@xh/hoist/core';
import {action, observable, observableRef, runInAction} from '@xh/hoist/mobx';
import {DocsCatalog, type DocsPayload} from '@xh/hoist-docs/docs';
import {isEmpty} from 'lodash';
import {sameDoc} from '../docs/DocUtils';
import type {DocCategory, DocEntry, DocSourceInfo} from '../docs/types';

export interface DocSearchResult {
    entry: DocEntry;
    score: number;
    /** Section of the doc that matched best, as a `section` path for the reader. */
    section?: string;
    /** A short plain-text excerpt from the start of the best-matching section. */
    snippet?: string;
    /** The query terms used, for client-side highlighting. */
    matchedTerms?: string[];
}

/** Where `pnpm docs` (scripts/export-docs.mjs) writes the docs, served from the client's public files. */
const DOCS_URL = '/public/hoist-docs';

/** localStorage key + cap for the mobile "recently viewed" docs list. */
const RECENT_DOCS_KEY = 'docs.recentDocs',
    RECENT_DOCS_MAX = 8;

/**
 * Service providing access to hoist-react and hoist-core documentation content.
 *
 * Docs come from @xh/hoist-docs, the same source AI agents read over MCP, for the Hoist versions
 * Toolbox runs. `pnpm docs` writes them into the client's public files at build time (or, during
 * development, straight from sibling hoist-react and hoist-core checkouts). This service loads
 * them on init and answers registry, content and ranked search in the browser, with the search
 * agents get - no server is involved.
 *
 * If the docs cannot be loaded (e.g. they were not exported), the service still installs: it sets
 * {@link unavailable}, which the viewers show as a message with a retry, and the rest of Toolbox
 * is unaffected.
 */
export class DocService extends HoistService {
    override telemetryPrefix = 'toolbox.client.docs';

    static instance: DocService;

    @observableRef accessor registry: DocEntry[] = [];

    /** True when the docs could not be loaded. */
    @observable accessor unavailable: boolean = false;
    @observableRef accessor sourceInfo: Record<string, DocSourceInfo> = {};

    /** Most-recently-viewed docs (most recent first), persisted locally - drives the mobile landing. */
    @observableRef accessor recentDocs: DocEntry[] = [];

    private catalog: DocsCatalog = null;

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
        await this.tryLoadAsync();
    }

    /** Retry loading docs after they were unavailable. */
    async retryAsync() {
        await this.tryLoadAsync();
    }

    /** The markdown content for a given doc entry. */
    async fetchContentAsync(source: string, docId: string): Promise<string> {
        const content = this.catalog?.content(source, docId);
        if (content == null) throw XH.exception(`Doc not found: ${source}:${docId}`);
        return content;
    }

    /**
     * Search docs by query string, with the ranking AI agents get from Hoist Docs. Each doc appears
     * once, with the section that matched best and an excerpt from it.
     */
    async searchDocsAsync(query: string): Promise<DocSearchResult[]> {
        if (!query?.trim() || !this.catalog) return [];

        const matchedTerms = query
            .toLowerCase()
            .split(/\s+/)
            .filter(t => t.length > 1);

        return this.catalog
            .search(query, 25)
            .map(r => ({
                entry: this.getDocEntry(r.id, r.source),
                score: r.score,
                section: r.section,
                snippet: isEmpty(r.snippet) ? null : stripMarkdown(r.snippet),
                matchedTerms
            }))
            .filter(r => r.entry != null);
    }

    //------------------
    // Implementation
    //------------------
    /** Load the docs, recording - rather than throwing - a failure to load them. */
    private async tryLoadAsync() {
        try {
            await this.loadDocsAsync();
            runInAction(() => (this.unavailable = false));
            this.hydrateRecentDocs();
        } catch (e) {
            this.logWarn('Docs unavailable - docs viewers will show a retry', e.message);
            runInAction(() => (this.unavailable = true));
        }
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

    private async loadDocsAsync() {
        return this.runner()
            .span('loadDocs')
            .run(async ctx => {
                const manifest: Array<{file: string}> = await XH.fetchJson(
                        {url: `${DOCS_URL}/index.json`},
                        ctx
                    ),
                    payloads: DocsPayload[] = await Promise.all(
                        manifest.map(it => XH.fetchJson({url: `${DOCS_URL}/${it.file}`}, ctx))
                    ),
                    catalog = new DocsCatalog(payloads),
                    {entries, sources} = catalog.registry();

                this.logInfo(
                    `Loaded docs: ${entries.length} entries from ${Object.keys(sources).length} sources`
                );

                this.catalog = catalog;
                runInAction(() => {
                    this.registry = entries;
                    this.sourceInfo = sources;
                });
            });
    }
}

/**
 * Reduce a markdown excerpt to plain text for display: drops inline code ticks, emphasis, heading
 * markers, image and link syntax (keeping link text), and table pipes.
 */
export function stripMarkdown(md: string): string {
    return md
        .replace(/`([^`]*)`/g, '$1')
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(^|[^\w*])[*_]([^*_\s][^*_]*?)[*_](?=[^\w*]|$)/g, '$1$2')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/(^|\s)#{1,6}\s+/g, '$1')
        .replace(/\s*\|\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
