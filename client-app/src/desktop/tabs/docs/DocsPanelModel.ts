import {GridModel} from '@xh/hoist/cmp/grid';
import {Content, HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {DockContainerModel} from '@xh/hoist/desktop/cmp/dock';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DocCategory, DocEntry, DocExampleLink, getDocExamples} from './docRegistry';
import {DocSearchResult, DocService} from '../../../core/svc/DocService';

export interface DocSection {
    id: string;
    title: string;
}

/**
 * Primary model for the Docs viewer tab.
 *
 * Manages a tree-based navigation grid of hoist-react and hoist-core documentation,
 * full-text search mode with ranked results, and loading of markdown content
 * for the selected doc. Active doc selection is synced with the URL via a
 * route parameter (e.g. /app/docs/core).
 */
export class DocsPanelModel extends HoistModel {
    private readonly BASE_ROUTE = 'default.docs';

    @managed
    gridModel: GridModel;

    @managed
    dockContainerModel: DockContainerModel = new DockContainerModel();

    @managed
    navPanelModel: PanelModel = new PanelModel({
        defaultSize: 280,
        minSize: 200,
        maxSize: 450,
        collapsible: true,
        resizable: true,
        side: 'left',
        persistWith: {localStorageKey: 'docsApp.navPanel'}
    });

    @bindable
    searchQuery: string = '';

    @observable
    searchMode: boolean = false;

    @observable.ref
    searchResults: DocSearchResult[] = [];

    @observable
    selectedSearchIdx: number = -1;

    @observable.ref
    activeDoc: DocEntry = null;

    @observable.ref
    content: string = null;

    @managed
    loadContentTask: TaskObserver = TaskObserver.trackLast();

    @observable
    activeSection: string = null;

    @bindable
    feedbackMessage: string = '';

    private get docService(): DocService {
        return DocService.instance;
    }

    constructor() {
        super();
        makeObservable(this);

        this.gridModel = this.createGridModel();

        this.addReaction(
            {
                track: () => this.searchQuery,
                run: query => this.runSearch(query),
                debounce: 200
            },
            {
                track: () => this.searchResults,
                run: () => (this.selectedSearchIdx = -1)
            },
            {
                track: () => this.gridModel.selectedRecord,
                run: rec => this.onSelectionChange(rec)
            },
            {
                track: () => XH.routerState.params,
                run: () => this.updateDocFromRoute()
            }
        );
    }

    override onLinked() {
        this.loadNav();
    }

    /** The source info for the currently active doc. */
    @computed
    get activeSource(): string | null {
        return this.activeDoc?.source ?? null;
    }

    /** The category of the currently active doc. */
    @computed
    get activeCategory(): DocCategory | null {
        if (!this.activeDoc) return null;
        const cats = this.docService.getCategories(this.activeDoc.source);
        return cats.find(c => c.id === this.activeDoc.category) ?? null;
    }

    /** Sibling docs in the same source + category as the active doc. */
    @computed
    get activeCategorySiblings(): DocEntry[] {
        if (!this.activeDoc) return [];
        return this.docService.getDocsByCategory(this.activeDoc.source, this.activeDoc.category);
    }

    /** Categories for the active doc's source. */
    @computed
    get activeSourceCategories(): DocCategory[] {
        if (!this.activeDoc) return [];
        return this.docService.getCategories(this.activeDoc.source);
    }

    /** H2-level sections parsed from the current document content. */
    @computed
    get sections(): DocSection[] {
        if (!this.content) return [];
        return extractSections(this.content);
    }

    /** Toolbox example tabs relevant to the active doc. */
    @computed
    get activeDocExamples(): DocExampleLink[] {
        if (!this.activeDoc) return [];
        return getDocExamples(this.activeDoc.id);
    }

    /** Navigate to a specific doc by source + ID. Updates grid selection, content, and route. */
    @action
    navigateToDoc(docId: string, source?: string) {
        const entry = source
            ? this.docService.getDocEntry(docId, source)
            : this.docService.getDocEntry(docId);
        if (!entry || (entry.id === this.activeDoc?.id && entry.source === this.activeDoc?.source))
            return;

        const rec = this.gridModel.store.getById(`${entry.source}:${entry.id}`);
        if (rec) this.gridModel.selModel.select(rec);

        this.activeDoc = entry;
        this.activeSection = null;
        this.searchMode = false;
        this.loadContentAsync(entry);
        this.updateRouteFromDoc();
    }

    /** Navigate to the first doc in a given source + category. */
    navigateToCategory(source: string, categoryId: string) {
        const firstDoc = this.docService.getDocsByCategory(source, categoryId)[0];
        if (firstDoc) this.navigateToDoc(firstDoc.id, firstDoc.source);
    }

    /** Toggle search mode on/off. */
    @action
    toggleSearchMode() {
        this.searchMode ? this.exitSearchMode() : this.enterSearchMode();
    }

    /** Enter search mode — switches content area to search results view. */
    @action
    enterSearchMode() {
        this.searchMode = true;
        this.searchQuery = '';
        this.searchResults = [];
        this.selectedSearchIdx = -1;
        this.docService.ensureIndexBuilt();
    }

    /** Exit search mode — returns to normal doc viewing. */
    @action
    exitSearchMode() {
        this.searchMode = false;
        this.searchQuery = '';
        this.searchResults = [];
        this.selectedSearchIdx = -1;
    }

    /** Select a search result — navigate to the doc and exit search. */
    @action
    selectSearchResult(entry: DocEntry) {
        this.navigateToDoc(entry.id, entry.source);
        this.exitSearchMode();
    }

    /** Move the keyboard selection within search results by the given delta (+1 / -1). */
    @action
    moveSearchSelection(delta: number) {
        const len = this.searchResults.length;
        if (!len) return;
        this.selectedSearchIdx = Math.max(0, Math.min(len - 1, this.selectedSearchIdx + delta));
    }

    /** Confirm the currently selected search result, if any. */
    confirmSearchSelection() {
        const result = this.searchResults[this.selectedSearchIdx];
        if (result) this.selectSearchResult(result.entry);
    }

    /** Handle keyboard navigation within search results. */
    onSearchKeyDown(e: KeyboardEvent) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.moveSearchSelection(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveSearchSelection(-1);
                break;
            case 'Enter':
                e.preventDefault();
                this.confirmSearchSelection();
                break;
            case 'Escape':
                e.preventDefault();
                this.exitSearchMode();
                break;
        }
    }

    /** Update the active section — called from scroll-based observation in the view. */
    @action
    setActiveSection(sectionId: string) {
        this.activeSection = sectionId;
    }

    /**
     * Open the feedback compose panel as a docked view.
     * @param content - factory for the feedback panel component (passed from the view
     *     to avoid a circular import between the model and view files).
     */
    openFeedbackPanel(content: Content) {
        const {dockContainerModel} = this;
        if (dockContainerModel.getView('docFeedback')) {
            dockContainerModel.expandView('docFeedback');
            return;
        }
        dockContainerModel.addView({
            id: 'docFeedback',
            title: 'Report Doc Issue',
            icon: Icon.comment(),
            width: 420,
            allowDialog: false,
            allowClose: true,
            content,
            onClose: () => this.closeFeedbackPanel()
        });
    }

    /** Close the feedback panel and clear the message. */
    @action
    closeFeedbackPanel() {
        this.feedbackMessage = '';
        const view = this.dockContainerModel.getView('docFeedback');
        if (view) this.dockContainerModel.removeView('docFeedback');
    }

    /** Submit feedback via activity tracking, then close the panel. */
    async submitFeedbackAsync() {
        const {activeDoc, activeSection, sections, feedbackMessage} = this;
        if (!feedbackMessage?.trim()) return;

        const sectionTitle = activeSection
            ? sections.find(s => s.id === activeSection)?.title
            : null;

        XH.track({
            category: 'Docs Feedback',
            message: feedbackMessage.trim(),
            data: {
                docId: activeDoc?.id,
                docSource: activeDoc?.source,
                docTitle: activeDoc?.title,
                section: sectionTitle
            },
            logData: true
        });
        await XH.trackService.pushPendingAsync();

        this.closeFeedbackPanel();
        XH.successToast('Feedback submitted — thank you!');
    }

    //------------------
    // Implementation
    //------------------
    private createGridModel(): GridModel {
        return new GridModel({
            selModel: 'single',
            treeMode: true,
            showHover: true,
            expandLevel: 1,
            store: {
                idSpec: 'id',
                fields: [
                    {name: 'title', type: 'string'},
                    {name: 'description', type: 'string'},
                    {name: 'isCategory', type: 'bool'},
                    {name: 'isSource', type: 'bool'},
                    {name: 'icon', type: 'auto'},
                    {name: 'order', type: 'int'}
                ]
            },
            sortBy: [{colId: 'order', sort: 'asc'}],
            emptyText: 'No matching docs found.',
            columns: [
                {
                    field: 'title',
                    flex: 1,
                    isTreeColumn: true
                },
                {
                    field: 'order',
                    hidden: true
                }
            ],
            hideHeaders: true
        });
    }

    /** Load all doc tree data into the grid, then select the doc from the route or default. */
    private loadNav() {
        this.gridModel.loadData(this.buildTreeData());

        const {docId} = XH.routerState.params;
        const registry = this.docService.registry;
        const initialDoc = (docId && this.docService.getDocEntry(docId)) || registry[0];
        if (initialDoc) this.navigateToDoc(initialDoc.id, initialDoc.source);
    }

    /**
     * Build tree data with source root nodes:
     *   Hoist React
     *     Overview
     *       Hoist React (doc)
     *       Docs Index (doc)
     *     ...
     *   Hoist Core
     *     Core Framework
     *       Base Classes (doc)
     *       ...
     */
    private buildTreeData(): any[] {
        let order = 0;
        const {docService} = this;

        return docService.sourceNames.map(sourceName => {
            const sourceLabel = docService.getSourceLabel(sourceName);
            const categories = docService.getCategories(sourceName);

            const catChildren = categories
                .map(cat => {
                    const docs = docService.getDocsByCategory(sourceName, cat.id);
                    if (docs.length === 0) return null;

                    return {
                        id: `${sourceName}:cat:${cat.id}`,
                        title: cat.title,
                        description: '',
                        isCategory: true,
                        isSource: false,
                        icon: this.getCategoryIcon(cat.id),
                        order: order++,
                        children: docs.map(doc => ({
                            id: `${doc.source}:${doc.id}`,
                            title: doc.title,
                            description: doc.description,
                            isCategory: false,
                            isSource: false,
                            icon: null,
                            order: order++
                        }))
                    };
                })
                .filter(Boolean);

            return {
                id: `source:${sourceName}`,
                title: sourceLabel,
                description: '',
                isCategory: false,
                isSource: true,
                icon: this.getSourceIcon(sourceName),
                order: order++,
                children: catChildren
            };
        });
    }

    /** Run search via DocService and update results. */
    private runSearch(query: string) {
        if (!this.searchMode) return;
        runInAction(() => {
            this.searchResults = this.docService.searchDocs(query);
        });
    }

    @action
    private onSelectionChange(record: any) {
        if (!record || record.data.isCategory || record.data.isSource) return;
        // Record IDs are formatted as "source:docId"
        const [source, ...idParts] = record.id.split(':');
        const docId = idParts.join(':');
        this.navigateToDoc(docId, source);
    }

    /** Route → doc: sync active doc when the URL changes. */
    private updateDocFromRoute() {
        const {name, params} = XH.routerState;
        if (!name.startsWith(this.BASE_ROUTE)) return;

        const {docId} = params;
        if (docId) this.navigateToDoc(docId);
    }

    /** Doc → route: push active doc ID into the URL. */
    private updateRouteFromDoc() {
        const {activeDoc, BASE_ROUTE} = this,
            {name} = XH.routerState;

        if (!name.startsWith(BASE_ROUTE)) return;

        if (activeDoc) {
            XH.navigate(`${BASE_ROUTE}.docId`, {docId: activeDoc.id}, {replace: true});
        } else {
            XH.navigate(BASE_ROUTE, {replace: true});
        }
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

    getCategoryIcon(categoryId: string) {
        switch (categoryId) {
            // hoist-react categories
            case 'overview':
                return Icon.home();
            case 'core':
                return Icon.gear();
            case 'components':
                return Icon.gridPanel();
            case 'desktop':
                return Icon.desktop();
            case 'mobile':
                return Icon.mobile();
            case 'utilities':
                return Icon.wrench();
            case 'concepts':
                return Icon.book();
            case 'supporting':
                return Icon.cube();
            case 'devops':
                return Icon.server();
            case 'upgrade':
                return Icon.arrowUp();
            // hoist-core categories
            case 'core-framework':
                return Icon.gear();
            case 'core-features':
                return Icon.gears();
            case 'infrastructure':
                return Icon.server();
            case 'app-development':
                return Icon.code();
            case 'grails-platform':
                return Icon.database();
            case 'build':
                return Icon.boxFull();
            default:
                return Icon.folder();
        }
    }

    getSourceIcon(sourceName: string) {
        switch (sourceName) {
            case 'hoist-react':
                return Icon.icon({iconName: 'react', prefix: 'fab'});
            case 'hoist-core':
                return Icon.server();
            default:
                return Icon.folder();
        }
    }
}

//------------------
// Section parsing
//------------------
/**
 * Parse H2 headings from raw markdown content into navigable sections.
 */
function extractSections(content: string): DocSection[] {
    const regex = /^## (.+)$/gm;
    const sections: DocSection[] = [],
        slugCounts = new Map<string, number>();
    let match: RegExpExecArray;
    while ((match = regex.exec(content)) !== null) {
        const title = stripInlineMarkdown(match[1].trim());
        let id = slugify(title);
        const count = slugCounts.get(id) || 0;
        if (count > 0) id += `-${count}`;
        slugCounts.set(id, count + 1);
        sections.push({id, title});
    }
    return sections;
}

/** Remove inline markdown formatting (code, bold, italic, links) to get plain text. */
function stripInlineMarkdown(text: string): string {
    return text
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\*\*([^*]*)\*\*/g, '$1')
        .replace(/\*([^*]*)\*/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .trim();
}

/** Convert text to a URL-safe slug: lowercase, strip special chars, hyphenate spaces. */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
