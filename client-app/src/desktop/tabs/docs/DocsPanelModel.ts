import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DOC_CATEGORIES, DOC_REGISTRY, DocCategory, DocEntry, getDocEntry} from './docRegistry';
import {DocSearchResult, DocService} from '../../../core/svc/DocService';

/**
 * Primary model for the Docs viewer tab.
 *
 * Manages a tree-based navigation grid of all hoist-react documentation,
 * full-text search mode with ranked results, and loading of markdown content
 * for the selected doc.
 */
export class DocsPanelModel extends HoistModel {
    @managed
    gridModel: GridModel;

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

    @observable.ref
    activeDoc: DocEntry = null;

    @observable.ref
    content: string = null;

    @observable
    isLoadingContent: boolean = false;

    private get docService(): DocService {
        return DocService.instance;
    }

    constructor() {
        super();
        makeObservable(this);

        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => this.searchQuery,
            run: query => this.runSearch(query),
            debounce: 200
        });

        this.addReaction({
            track: () => this.gridModel.selectedRecord,
            run: rec => this.onSelectionChange(rec)
        });
    }

    override onLinked() {
        this.loadNav();
    }

    /** The category of the currently active doc. */
    @computed
    get activeCategory(): DocCategory | null {
        if (!this.activeDoc) return null;
        return DOC_CATEGORIES.find(c => c.id === this.activeDoc.category) ?? null;
    }

    /** Sibling docs in the same category as the active doc. */
    @computed
    get activeCategorySiblings(): DocEntry[] {
        if (!this.activeDoc) return [];
        return DOC_REGISTRY.filter(d => d.category === this.activeDoc.category);
    }

    /** Navigate to a specific doc by ID. Used for internal link interception. */
    @action
    navigateToDoc(docId: string) {
        const entry = getDocEntry(docId);
        if (!entry || entry.id === this.activeDoc?.id) return;

        const rec = this.gridModel.store.getById(entry.id);
        if (rec) this.gridModel.selModel.select(rec);

        this.activeDoc = entry;
        this.loadContentAsync(entry);
    }

    /** Navigate to the first doc in a given category. */
    navigateToCategory(categoryId: string) {
        const firstDoc = DOC_REGISTRY.find(d => d.category === categoryId);
        if (firstDoc) this.navigateToDoc(firstDoc.id);
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
    }

    /** Exit search mode — returns to normal doc viewing. */
    @action
    exitSearchMode() {
        this.searchMode = false;
        this.searchQuery = '';
        this.searchResults = [];
    }

    /** Select a search result — navigate to the doc and exit search. */
    @action
    selectSearchResult(docId: string) {
        this.navigateToDoc(docId);
        this.exitSearchMode();
    }

    //------------------
    // Implementation
    //------------------
    private createGridModel(): GridModel {
        return new GridModel({
            selModel: 'single',
            treeMode: true,
            showHover: true,
            expandLevel: 10,
            store: {
                idSpec: 'id',
                fields: [
                    {name: 'title', type: 'string'},
                    {name: 'description', type: 'string'},
                    {name: 'isCategory', type: 'bool'},
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

    /** Load all doc tree data into the grid once. */
    private loadNav() {
        this.gridModel.loadData(this.buildTreeData());

        // Auto-select first doc on initial load
        if (DOC_REGISTRY.length > 0) {
            const firstDoc = DOC_REGISTRY[0];
            const rec = this.gridModel.store.getById(firstDoc.id);
            if (rec) {
                this.gridModel.selModel.select(rec);
                this.activeDoc = firstDoc;
                this.loadContentAsync(firstDoc);
            }
        }
    }

    private buildTreeData(): any[] {
        let order = 0;
        return DOC_CATEGORIES.map(cat => {
            const docs = DOC_REGISTRY.filter(d => d.category === cat.id);
            if (docs.length === 0) return null;

            return {
                id: `cat:${cat.id}`,
                title: cat.title,
                description: '',
                isCategory: true,
                icon: this.getCategoryIcon(cat.id),
                order: order++,
                children: docs.map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    description: doc.description,
                    isCategory: false,
                    icon: null,
                    order: order++
                }))
            };
        }).filter(Boolean);
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
        if (!record || record.data.isCategory) return;

        const entry = DOC_REGISTRY.find(d => d.id === record.id);
        if (!entry || entry.id === this.activeDoc?.id) return;

        this.activeDoc = entry;
        this.loadContentAsync(entry);
    }

    private async loadContentAsync(entry: DocEntry) {
        runInAction(() => {
            this.isLoadingContent = true;
            this.content = null;
        });
        try {
            const content = await this.docService.fetchContentAsync(entry.id);
            runInAction(() => (this.content = content));
        } catch (e) {
            runInAction(() => {
                this.content = `## Error Loading Document\n\nFailed to load **${entry.title}**.\n\n\`${e.message}\``;
            });
            XH.handleException(e, {showAlert: false});
        } finally {
            runInAction(() => (this.isLoadingContent = false));
        }
    }

    getCategoryIcon(categoryId: string) {
        switch (categoryId) {
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
            default:
                return Icon.folder();
        }
    }
}
