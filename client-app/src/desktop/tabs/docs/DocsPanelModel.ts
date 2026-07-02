import {GridModel} from '@xh/hoist/cmp/grid';
import {Content, managed, XH} from '@xh/hoist/core';
import {DockContainerModel} from '@xh/hoist/desktop/cmp/dock';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DocViewModel} from '../../../core/docs/DocViewModel';
import {getCategoryIcon, getSourceIcon} from '../../../core/docs/DocIcons';
import {DocEntry, DocExampleLink, getDocExamples} from './docRegistry';
import {DocSearchResult} from '../../../core/svc/DocService';

/**
 * Primary model for the Docs viewer tab.
 *
 * Extends DocViewModel for shared viewer state and extends it with desktop-specific chrome:
 * a tree-based navigation grid, full-text search mode with ranked results, and a feedback dock.
 * Active doc selection is synced with the URL via a route parameter (e.g. /app/docs/core).
 */
export class DocsPanelModel extends DocViewModel {
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

    @bindable
    feedbackMessage: string = '';

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
            }
        );
    }

    override onLinked() {
        super.onLinked();
        this.loadNav();
    }

    /** Desktop hangs the active doc off a `docRef` child of the docs tab route. */
    protected override get docRouteName(): string {
        return `${this.BASE_ROUTE}.docRef`;
    }

    /** Sync grid selection + exit search whenever a doc is activated. */
    protected override onDocActivated(entry: DocEntry) {
        const recId = `${entry.source}:${entry.id}`;
        this.gridModel.selectAsync(recId, {ensureVisible: true});
        this.searchMode = false;
    }

    /** Toolbox example tabs relevant to the active doc. */
    @computed
    get activeDocExamples(): DocExampleLink[] {
        return this.activeDoc ? getDocExamples(this.activeDoc.id) : [];
    }

    /** Toggle search mode on/off. */
    @action
    toggleSearchMode() {
        this.searchMode ? this.exitSearchMode() : this.enterSearchMode();
    }

    /** Enter search mode - switches content area to search results view. */
    @action
    enterSearchMode() {
        this.searchMode = true;
        this.searchQuery = '';
        this.searchResults = [];
        this.selectedSearchIdx = -1;
        this.docService.ensureIndexBuilt();
    }

    /** Exit search mode - returns to normal doc viewing. */
    @action
    exitSearchMode() {
        this.searchMode = false;
        this.searchQuery = '';
        this.searchResults = [];
        this.selectedSearchIdx = -1;
    }

    /** Select a search result - navigate to the doc and exit search. */
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
        XH.successToast('Feedback submitted - thank you!');
    }

    //------------------
    // Implementation
    //------------------
    private createGridModel(): GridModel {
        return new GridModel({
            selModel: 'single',
            treeMode: true,
            clicksToExpand: 1,
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

        const ref = this.docRefFromRoute(XH.routerState.params),
            registry = this.docService.registry,
            fromRoute = ref && this.docService.getDocEntry(ref.docId, ref.source),
            initialDoc = fromRoute || registry[0];
        if (initialDoc) {
            this.navigateToDoc(initialDoc.id, initialDoc.source, fromRoute ? ref.section : null);
        }
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

    /** Delegate to the shared doc-icon helpers (kept as instance methods for view call-sites). */
    getCategoryIcon(categoryId: string) {
        return getCategoryIcon(categoryId);
    }

    getSourceIcon(sourceName: string) {
        return getSourceIcon(sourceName);
    }
}
