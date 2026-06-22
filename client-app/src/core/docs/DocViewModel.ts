import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {action, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DocService} from '../svc/DocService';
import {DocCategory, DocEntry, DocSection} from './types';
import {extractSections, resolveDocLink} from './DocUtils';

/**
 * Shared, platform-neutral base for the documentation viewer. Owns the active doc, its loaded
 * markdown content, parsed H2 sections, active/pending-scroll section state, and the bidirectional
 * sync between the active doc and the `default.docs.docRef` route (identical on desktop + mobile).
 *
 * Subclasses add platform-specific chrome (desktop: tree-grid nav, search, feedback dock; mobile:
 * a Navigator page) and may override `onDocActivated` to react to doc changes.
 */
export class DocViewModel extends HoistModel {
    protected readonly BASE_ROUTE = 'default.docs';

    @observable.ref activeDoc: DocEntry = null;
    @observable.ref content: string = null;
    @observable activeSection: string = null;

    /**
     * Section slug a deep-link requested we scroll to once content renders. Consumed and cleared by
     * the view; not persisted to the URL (sections are scroll-to-on-arrival targets).
     */
    @observable pendingScrollSection: string = null;

    @managed loadContentTask: TaskObserver = TaskObserver.trackLast();

    protected get docService(): DocService {
        return DocService.instance;
    }

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => XH.routerState.params,
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
        this.onDocActivated(entry);
        this.loadContentAsync(entry);
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

    private updateDocFromRoute() {
        const {name, params} = XH.routerState;
        if (!name.startsWith(this.BASE_ROUTE)) return;
        const ref = this.docRefFromRoute(params);
        if (ref) this.navigateToDoc(ref.docId, ref.source, ref.section);
    }

    private updateRouteFromDoc() {
        const {activeDoc, BASE_ROUTE} = this,
            {name} = XH.routerState;
        if (!name.startsWith(BASE_ROUTE)) return;

        if (activeDoc) {
            XH.navigate(
                `${BASE_ROUTE}.docRef`,
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

    private async loadContentAsync(entry: DocEntry) {
        runInAction(() => (this.content = null));
        try {
            const content = await this.docService
                .fetchContentAsync(entry.source, entry.id)
                .linkTo(this.loadContentTask);
            runInAction(() => (this.content = content));
        } catch (e) {
            runInAction(() => {
                this.content = `## Error Loading Document\n\nFailed to load **${entry.title}**.\n\n\`${e.message}\``;
            });
            XH.handleException(e, {showAlert: false});
        }
    }
}
