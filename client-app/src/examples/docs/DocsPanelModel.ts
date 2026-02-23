import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DOC_CATEGORIES, DOC_REGISTRY, DocEntry, getDocEntry} from './docRegistry';
import {DocService} from './DocService';

/**
 * Primary model for the Docs viewer application.
 *
 * Manages a tree-based navigation grid of all hoist-react documentation,
 * text-based filtering, and loading of markdown content for the selected doc.
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
            run: () => this.filterNav(),
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

    /** Navigate to a specific doc by ID. Used for internal link interception. */
    @action
    navigateToDoc(docId: string) {
        const entry = getDocEntry(docId);
        if (!entry || entry.id === this.activeDoc?.id) return;

        // Clear search and filter so the target is visible in the tree
        this.searchQuery = '';
        this.gridModel.store.clearFilter();

        const rec = this.gridModel.store.getById(entry.id);
        if (rec) this.gridModel.selModel.select(rec);

        this.activeDoc = entry;
        this.loadContentAsync(entry);
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

    /**
     * Apply or clear a Store filter based on the current search query.
     * Uses Store filtering (rather than rebuilding tree data) to preserve
     * stable record ordering. The Store's tree filter logic automatically
     * includes parent (category) records when their children match.
     */
    private filterNav() {
        const {searchQuery, docService, gridModel} = this;
        if (!searchQuery?.trim()) {
            gridModel.store.clearFilter();
            return;
        }

        const matches = docService.searchDocs(searchQuery);
        const matchIds = new Set(matches.map(m => m.id));
        gridModel.store.setFilter(rec => matchIds.has(rec.id as string));
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

    private getCategoryIcon(categoryId: string) {
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
