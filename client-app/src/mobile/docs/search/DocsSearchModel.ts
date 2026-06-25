import {HoistModel, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {encodeDocId} from '../../../core/docs/DocUtils';
import {DocEntry} from '../../../core/docs/types';
import {DocService, DocSearchResult} from '../../../core/svc/DocService';

/** A library-grouped block of search hits. */
export interface SearchResultGroup {
    source: string;
    label: string;
    results: DocSearchResult[];
}

/** localStorage key + cap for recent search terms. */
const RECENT_SEARCHES_KEY = 'docs.recentSearches',
    RECENT_SEARCHES_MAX = 8;

/**
 * Model for the dedicated docs search screen. Runs cross-corpus full-text search via the shared
 * {@link DocService}, enriching each hit with a matched-line snippet, and keeps a persisted list of
 * recent searches for the empty state. Results are grouped by library for display.
 */
export class DocsSearchModel extends HoistModel {
    @bindable query: string = '';
    @observable.ref results: DocSearchResult[] = [];
    @observable.ref recentSearches: string[] = [];

    private get docService(): DocService {
        return DocService.instance;
    }

    constructor() {
        super();
        makeObservable(this);
        this.recentSearches = XH.localStorageService.get(RECENT_SEARCHES_KEY, []);
    }

    override onLinked() {
        this.docService.ensureIndexBuilt();
        this.addReaction({
            track: () => this.query,
            run: () => this.runSearch(),
            debounce: 200
        });
    }

    /** Results grouped under their library, in the service's source order. */
    get groupedResults(): SearchResultGroup[] {
        const {results, docService} = this;
        return docService.sourceNames
            .map(source => ({
                source,
                label: docService.getSourceLabel(source),
                results: results.filter(r => r.entry.source === source)
            }))
            .filter(g => g.results.length > 0);
    }

    get hasQuery(): boolean {
        return !!this.query?.trim();
    }

    /** Re-run a recent search term. */
    runRecent(term: string) {
        this.query = term;
    }

    @action
    removeRecent(term: string) {
        this.recentSearches = this.recentSearches.filter(t => t !== term);
        XH.localStorageService.set(RECENT_SEARCHES_KEY, this.recentSearches);
    }

    /** Open a hit in the reader (stacked on search, so back returns to results), recording the term. */
    selectResult(entry: DocEntry) {
        this.commitRecent();
        XH.appendRoute('doc', {source: entry.source, docId: encodeDocId(entry.id)});
    }

    //------------------
    // Implementation
    //------------------
    private runSearch() {
        const query = this.query?.trim();
        if (!query) {
            runInAction(() => (this.results = []));
            return;
        }
        const terms = this.queryTerms(query),
            hits = this.docService.searchDocs(query).map(r => ({
                ...r,
                matchedTerms: terms,
                snippet: this.docService.getContentSnippet(r.entry.source, r.entry.id, terms)
            }));
        runInAction(() => (this.results = hits));
    }

    private queryTerms(query: string): string[] {
        return query
            .toLowerCase()
            .split(/\s+/)
            .filter(t => t.length > 1);
    }

    /** Persist the current query as a recent search (most recent first, de-duped, capped). */
    @action
    private commitRecent() {
        const term = this.query?.trim();
        if (!term) return;
        this.recentSearches = [term, ...this.recentSearches.filter(t => t !== term)].slice(
            0,
            RECENT_SEARCHES_MAX
        );
        XH.localStorageService.set(RECENT_SEARCHES_KEY, this.recentSearches);
    }
}
