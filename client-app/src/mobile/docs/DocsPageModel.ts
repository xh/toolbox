import {XH} from '@xh/hoist/core';
import {computed} from '@xh/hoist/mobx';
import {DocEntry} from '../../core/docs/types';
import {DocViewModel} from '../../core/docs/DocViewModel';

/**
 * Mobile Docs reader model. The reader mounts at a `doc` route segment that carries the doc params
 * directly (no `docRef` child as on desktop). That segment lives at three nodes - a browse drilldown
 * (`default.docs.corpus.category.doc`), a search result (`default.docs.search.doc`), and a deep-link
 * child of each example (`default.<example>.doc`) - so the reader always stacks on top of its origin
 * and the standard back / edge-swipe returns there. All three end in `.doc`, and route write-backs
 * (e.g. following an in-content doc link) must stay on whichever one is current.
 */
export class DocsPageModel extends DocViewModel {
    protected override isDocsRoute(name: string): boolean {
        return name.endsWith('.doc');
    }

    protected override get docRouteName(): string {
        return XH.routerState.name;
    }

    /**
     * Browse readers nest under a `category` segment whose `categoryId` param must be preserved on
     * write-back; the search/example readers do not carry it. Detect by route name so we never emit a
     * stray query param on the flatter routes.
     */
    protected override routeParamsForDoc(entry: DocEntry): Record<string, string> {
        const params = super.routeParamsForDoc(entry);
        if (XH.routerState.name.includes('.category.')) params.categoryId = entry.category;
        return params;
    }

    /** Index of the active doc within its category siblings, or -1. */
    @computed
    private get activeSiblingIdx(): number {
        const {activeDoc, activeCategorySiblings} = this;
        if (!activeDoc) return -1;
        return activeCategorySiblings.findIndex(
            d => d.id === activeDoc.id && d.source === activeDoc.source
        );
    }

    /** Previous doc in the current category, for the reader's pager (or null at the start). */
    @computed
    get prevDoc(): DocEntry | null {
        const idx = this.activeSiblingIdx;
        return idx > 0 ? this.activeCategorySiblings[idx - 1] : null;
    }

    /** Next doc in the current category, for the reader's pager (or null at the end). */
    @computed
    get nextDoc(): DocEntry | null {
        const {activeSiblingIdx: idx, activeCategorySiblings: sibs} = this;
        return idx >= 0 && idx < sibs.length - 1 ? sibs[idx + 1] : null;
    }

    navigatePrev() {
        const {prevDoc} = this;
        if (prevDoc) this.navigateToDoc(prevDoc.id, prevDoc.source);
    }

    navigateNext() {
        const {nextDoc} = this;
        if (nextDoc) this.navigateToDoc(nextDoc.id, nextDoc.source);
    }

    override onLinked() {
        super.onLinked();
        this.loadInitialDocFromRoute();
    }
}
