import {HoistModel, LoadSpec, XH} from '@xh/hoist/core';
import {action, computed, observable, runInAction} from '@xh/hoist/mobx';
import {DocService} from '../svc/DocService';
import {DocCategory, DocEntry, DocSection} from './types';
import {extractSections, resolveDocLink} from './DocUtils';

/**
 * Shared, platform-neutral base for the documentation viewer. Owns the active doc, its loaded
 * markdown content, parsed H2 sections, active/pending-scroll section state, and the bidirectional
 * sync between the active doc and the docs route.
 *
 * The route *shape* differs by platform, so subclasses set `docRouteName` and `isDocsRoute`: desktop
 * hangs a `docRef` child off the docs tab (`default.docs.docRef`), while mobile mounts the reader as a
 * drilldown child of the current example (`default.<example>.docs`) plus a standalone `default.docs`.
 * Subclasses also add platform-specific chrome (desktop: tree-grid nav, search, feedback dock; mobile:
 * a Navigator page) and may override `onDocActivated` to react to doc changes.
 *
 * Abstract: never instantiated directly - both platforms subclass it.
 */
export abstract class DocViewModel extends HoistModel {
    protected readonly BASE_ROUTE = 'default.docs';

    /**
     * Full route name to write a specific doc's params back to. Defaults to the bare `BASE_ROUTE`
     * (the platform-neutral anchor). The desktop viewer overrides this to add its `.docRef` child
     * segment; the mobile reader overrides it to the live current route name, so write-backs from
     * in-content links stay on whichever `*.docs` route is currently active.
     */
    protected get docRouteName(): string {
        return this.BASE_ROUTE;
    }

    @observable.ref accessor activeDoc: DocEntry = null;
    @observable accessor content: string = null;
    @observable accessor activeSection: string = null;

    /**
     * Section slug a deep-link requested we scroll to once content renders. Consumed and cleared by
     * the view; not persisted to the URL (sections are scroll-to-on-arrival targets).
     */
    @observable accessor pendingScrollSection: string = null;

    protected get docService(): DocService {
        return DocService.instance;
    }

    /**
     * Wire the route-sync reaction once linked (the Hoist-idiomatic place for reactions, vs. the
     * constructor). Tracks the full `routerState` ref so route-*name* changes are caught too, not just
     * param changes. Subclasses that override `onLinked` must call `super.onLinked()`.
     */
    override onLinked() {
        this.addReaction({
            track: () => XH.routerState,
            run: () => this.updateDocFromRoute()
        });
    }

    /** H2-level sections parsed from the current document content. */
    @computed
    get sections(): DocSection[] {
        return this.content ? extractSections(this.content) : [];
    }

    @computed
    get activeSource(): string | null {
        return this.activeDoc?.source ?? null;
    }

    @computed
    get activeCategory(): DocCategory | null {
        if (!this.activeDoc) return null;
        const cats = this.docService.getCategories(this.activeDoc.source);
        return cats.find(c => c.id === this.activeDoc.category) ?? null;
    }

    @computed
    get activeCategorySiblings(): DocEntry[] {
        if (!this.activeDoc) return [];
        return this.docService.getDocsByCategory(this.activeDoc.source, this.activeDoc.category);
    }

    @computed
    get activeSourceCategories(): DocCategory[] {
        if (!this.activeDoc) return [];
        const {source} = this.activeDoc;
        return this.docService
            .getCategories(source)
            .filter(cat => this.docService.getDocsByCategory(source, cat.id).length > 0);
    }

    /**
     * Navigate to a specific doc by source + ID, optionally scrolling to a section (an H2 slug).
     * If the requested doc is already active, only the section scroll is (re)triggered.
     */
    @action
    navigateToDoc(docId: string, source?: string, section?: string) {
        const entry = source
            ? this.docService.getDocEntry(docId, source)
            : this.docService.getDocEntry(docId);
        if (!entry) return;

        const sameDoc = entry.id === this.activeDoc?.id && entry.source === this.activeDoc?.source;
        if (sameDoc) {
            if (section) this.pendingScrollSection = section;
            return;
        }

        this.activeDoc = entry;
        this.activeSection = null;
        this.pendingScrollSection = section ?? null;
        this.content = null;
        this.onDocActivated(entry);
        this.loadAsync();
        this.updateRouteFromDoc();
    }

    /** Navigate to the first doc in a given source + category. */
    navigateToCategory(source: string, categoryId: string) {
        const firstDoc = this.docService.getDocsByCategory(source, categoryId)[0];
        if (firstDoc) this.navigateToDoc(firstDoc.id, firstDoc.source);
    }

    @action
    setActiveSection(sectionId: string) {
        this.activeSection = sectionId;
    }

    /**
     * Request a scroll to the given H2 section. Routes through `pendingScrollSection` so the single
     * scroll-and-track path in `docContent` (shared by deep-link arrivals) does the work, rather than
     * each caller reaching into the DOM.
     */
    @action
    scrollToSection(sectionId: string) {
        this.pendingScrollSection = sectionId;
    }

    @action
    clearPendingScrollSection() {
        this.pendingScrollSection = null;
    }

    /** Resolve an in-content relative href to another doc entry (or undefined). */
    resolveContentLink(href: string): DocEntry | undefined {
        return this.activeDoc ? resolveDocLink(this.activeDoc, href) : undefined;
    }

    //------------------
    // Subclass hooks / route sync
    //------------------
    /** Hook for subclasses to react when a new doc becomes active (default no-op). */
    protected onDocActivated(entry: DocEntry) {}

    /** Read the current route and activate the doc it references, if any. */
    protected loadInitialDocFromRoute() {
        const ref = this.docRefFromRoute(XH.routerState.params);
        if (ref) this.navigateToDoc(ref.docId, ref.source, ref.section);
    }

    /**
     * Whether the given route name is one this viewer should sync with. Defaults to any route at or
     * below `BASE_ROUTE` (covers desktop's `default.docs` tab and its `.docRef` child). The mobile
     * reader overrides this, since it also mounts as a drilldown child of each example
     * (`default.<example>.docs`), which does not share the `default.docs` prefix.
     */
    protected isDocsRoute(name: string): boolean {
        return name.startsWith(this.BASE_ROUTE);
    }

    private updateDocFromRoute() {
        const {name, params} = XH.routerState;
        if (!this.isDocsRoute(name)) return;
        const ref = this.docRefFromRoute(params);
        if (ref) this.navigateToDoc(ref.docId, ref.source, ref.section);
    }

    private updateRouteFromDoc() {
        const {activeDoc, BASE_ROUTE, docRouteName} = this,
            {name} = XH.routerState;
        if (!this.isDocsRoute(name)) return;

        if (activeDoc) {
            XH.navigate(
                docRouteName,
                {source: activeDoc.source, docId: this.docIdToRoute(activeDoc.id)},
                {replace: true}
            );
        } else {
            XH.navigate(BASE_ROUTE, {replace: true});
        }
    }

    private docIdToRoute(docId: string): string {
        return docId.replaceAll('/', '~');
    }

    protected docRefFromRoute(params: Record<string, string>): {
        source: string;
        docId: string;
        section: string;
    } {
        const {source, docId, section} = params;
        if (!source || !docId) return null;
        return {source, docId: docId.replaceAll('~', '/'), section: section ?? null};
    }

    /**
     * Load the active doc's markdown content. Triggered via `loadAsync()` on navigation (and on the
     * standard mount / refresh / auto-refresh entry points). Routing this through the managed load
     * lifecycle gives us `loadObserver` for masking and, crucially, `loadSpec.isStale` - so a slow
     * earlier fetch cannot overwrite the content of a later navigation. `content` is cleared by
     * `navigateToDoc` on a doc change (not here), so an auto-refresh of the same doc never blanks it.
     */
    override async doLoadAsync(loadSpec: LoadSpec) {
        const {activeDoc} = this;
        if (!activeDoc) return;
        try {
            const content = await this.docService.fetchContentAsync(activeDoc.source, activeDoc.id);
            if (loadSpec.isStale) return;
            runInAction(() => (this.content = content));
        } catch (e) {
            if (loadSpec.isStale) return;
            runInAction(() => {
                this.content = `## Error Loading Document\n\nFailed to load **${activeDoc.title}**.\n\n\`${e.message}\``;
            });
            XH.handleException(e, {showAlert: false});
        }
    }
}
