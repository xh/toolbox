import type {
    Blueprint,
    BlueprintAccessSpec,
    BlueprintDataProvider,
    BlueprintIssue,
    BlueprintLinkParams,
    BlueprintPublish,
    BlueprintRepository,
    BlueprintSummary
} from '@xh/hoist-chat-kit/blueprint';
import {
    BlueprintDesignModel,
    BlueprintDocumentModel,
    BlueprintModel,
    DataCatalog,
    isGlobal
} from '@xh/hoist-chat-kit/blueprint';
import type {ChatModel} from '@xh/hoist-chat-kit/core';
import {
    chatUiCalloutSpec,
    chatUiStackSpec,
    chatUiTextSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';
import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {addToBlueprint} from '@xh/hoist-chat-kit/genui/architect';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {LoadSpec, PlainObject} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {fmtCompactDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {
    action,
    bindable,
    compareStructural,
    computed,
    observable,
    observableRef,
    runInAction
} from '@xh/hoist/mobx';
import {find, pick} from 'lodash';
import {LocalThreadStore} from '../desktop/tabs/chatkit/integrations/LocalThreadStore';
import {createArchitectChat} from './architectChat';
import {revealEdit} from './editor/historyTimeline';
import {copyLinkAsync} from './copyLink';
import {LIBRARY_GROUPS, libraryGroup, libraryName, libraryStatus} from './libraryColumns';
import {featureRequestSink} from './featureRequestSink';
import {usageBlockedReason} from './llmUsage';
import type {LlmUsage} from './llmUsage';
import {createRepository} from './repository/createRepository';
import {ServerDataProvider} from './ServerDataProvider';
import type {BlueprintTypeSpec} from './blueprintTypes';

/** What the designer shows beside the Architect: the open blueprint, or a reference page. */
export type DesignerView = 'blueprint' | 'catalog' | 'registry';

/** A new blueprint: an empty dashboard, ready for widgets. */
const EMPTY_BLUEPRINT = {
    root: 'dashboard',
    elements: {dashboard: {component: 'dashCanvas', children: []}}
} as Blueprint;

const MAX_RECENT = 5;

// The id of the library's hint row, shown in Yours when the user has none of their own.
export const NONE_OF_YOURS = '__noneOfYours';

// The local library this designer kept before blueprints moved to the server. Dropped on load.
const OLD_LIBRARY_KEY = 'blueprints.designer.library';

export interface BlueprintShellConfig {
    /**
     * Names the shell's local state: its selection, and its conversations as `<key>.threads`.
     * Default the Blueprints tab's.
     */
    storageKey?: string;
    /** The route that opens one blueprint by its `id` param, with link params. Default none. */
    route?: string;
    /** The kind of blueprint the shell holds, with its datasets and registry. */
    type: BlueprintTypeSpec;
    createProvider?: (catalog: DataCatalog) => BlueprintDataProvider;
    repository?: BlueprintRepository;
}

/**
 * A blueprint app's shell: a library of blueprints in a {@link BlueprintRepository}, each with its
 * own conversation with the Architect. The Blueprints tab and the blueprint example apps share it. One {@link BlueprintModel}, opened through a
 * {@link BlueprintDocumentModel}, and one Architect `ChatModel` hold the selected blueprint, once
 * the server's Data Catalog loads. The user's own blueprints open as drafts, which save as they
 * change. Other users' blueprints open at their latest publish, read-only.
 */
export class BlueprintShellModel extends HoistModel {
    /** The blueprints the user may read, as the repository lists them. */
    @observableRef accessor summaries: BlueprintSummary[] = [];
    @bindable accessor selectedId: string = null;
    @bindable accessor view: DesignerView = 'blueprint';

    /** True while the library shows, as when nothing is open, in place of the open blueprint. */
    @bindable accessor libraryOpen = true;
    @bindable accessor shareOpen = false;

    /** How the open blueprint shows: as its canvas, its wiring map, or JSON. */
    @bindable accessor editorView: 'canvas' | 'map' | 'json' = 'canvas';

    /** The blueprints opened lately, latest first, for the quick switcher. */
    @bindable accessor recentIds: string[] = [];

    /** Issues from opening the selected blueprint. Errors mean it could not be shown. */
    @observableRef accessor openIssues: BlueprintIssue[] = [];

    /** Issues from the last save or publish, such as a stale draft. */
    @observableRef accessor saveIssues: BlueprintIssue[] = [];

    /** Every publish of the blueprint open, oldest first. */
    @observableRef accessor publishes: BlueprintPublish[] = [];

    @observable accessor isSaving = false;

    /** The user's use of the Claude API relay, or null if unknown or not allowed. */
    @observableRef accessor usage: LlmUsage = null;

    /** Null until the catalog loads. */
    @observableRef accessor blueprintModel: BlueprintModel = null;

    /** Opens, saves and publishes the selected blueprint through the repository. */
    @observableRef accessor documentModel: BlueprintDocumentModel = null;

    /** Selection and structural edits on the open blueprint, in design mode. */
    @observableRef accessor designModel: BlueprintDesignModel = null;

    /** The Architect's answers: text and layout around the blueprint's own widgets and data. */
    @observableRef accessor answerCatalog: ChatUiCatalog = null;

    /** The Architect, holding the selected blueprint's conversation. Null until the catalog loads. */
    @observableRef accessor chatModel: ChatModel = null;

    readonly repository: BlueprintRepository;

    /** The route that opens one blueprint, if the app has one. */
    readonly route: string;

    /** Each blueprint's conversation with the Architect, by blueprint ID. */
    readonly threadStore: LocalThreadStore;

    @managed listGridModel = new GridModel({
        store: {idSpec: 'id'},
        groupBy: 'group',
        groupSortFn: (a, b) => LIBRARY_GROUPS.indexOf(a) - LIBRARY_GROUPS.indexOf(b),
        sortBy: 'name',
        emptyText: 'No blueprints match.',
        showGroupRowCounts: false,
        groupRowRenderer: ({value, node}) => {
            const n = node.allLeafChildren.filter(it => !it.data?.data.placeholder).length;
            return `${value} (${n})`;
        },
        rowClassFn: rec => (rec?.data.placeholder ? 'tb-library__hint' : null),
        onRowDoubleClicked: ({data}) => data && !data.placeholder && this.selectAsync(data.id),
        contextMenu: [
            {
                text: 'Open',
                icon: Icon.openExternal(),
                recordsRequired: 1,
                displayFn: ({record}) => ({hidden: !!record?.data.placeholder}),
                actionFn: ({record}) => this.selectAsync(record.id as string)
            },
            {
                text: 'Copy',
                icon: Icon.copy(),
                recordsRequired: 1,
                displayFn: ({record}) => ({hidden: !!record?.data.placeholder}),
                actionFn: ({record}) => this.copyFromLibraryAsync(record.id as string)
            },
            {
                text: 'Copy link',
                icon: Icon.link(),
                recordsRequired: 1,
                displayFn: ({record}) => ({hidden: !this.route || !!record?.data.placeholder}),
                actionFn: ({record}) => copyLinkAsync(this.linkTo(record.id as string))
            },
            {
                text: 'Rename...',
                icon: Icon.edit(),
                recordsRequired: 1,
                displayFn: ({record}) => ({
                    hidden: !this.repository.renameAsync || !this.isOwnRow(record)
                }),
                actionFn: ({record}) => this.renameFromLibraryAsync(record.id as string)
            },
            {
                text: 'Share...',
                icon: Icon.users(),
                recordsRequired: 1,
                displayFn: ({record}) => ({hidden: !this.isOwnRow(record)}),
                actionFn: ({record}) => this.shareFromLibraryAsync(record.id as string)
            },
            '-',
            {
                text: 'Delete',
                icon: Icon.delete(),
                recordsRequired: 1,
                displayFn: ({record}) => ({hidden: !this.isOwnRow(record)}),
                actionFn: ({record}) => this.deleteFromLibraryAsync(record.id as string)
            }
        ],
        columns: [
            {field: 'group', hidden: true},
            {
                field: 'name',
                flex: 1,
                minWidth: 220,
                rendererIsComplex: true,
                renderer: (v: string, {record}) => libraryName(v, record.data.description),
                tooltip: (v, {record}) => record.data.description ?? v
            },
            {field: 'description', hidden: true},
            {field: 'owner', width: 140, cellClass: 'tb-blueprints__owner'},
            {
                field: 'status',
                width: 200,
                rendererIsComplex: true,
                renderer: (v, {record}) => libraryStatus(record.data)
            },
            {field: 'draftVersion', hidden: true},
            {field: 'publishedVersion', hidden: true},
            {field: 'readOnly', hidden: true},
            {field: 'global', hidden: true},
            {field: 'placeholder', hidden: true},
            {field: 'updated', width: 130, renderer: v => (v ? fmtCompactDate(v) : null)}
        ]
    });

    private createProvider: (catalog: DataCatalog) => BlueprintDataProvider;

    private opening: Promise<void> = Promise.resolve();
    private lastLink: string = null;

    get selected(): BlueprintSummary {
        return find(this.summaries, {id: this.selectedId}) ?? null;
    }

    /** True if the blueprint open is a draft the user may edit. */
    get canEdit(): boolean {
        const doc = this.documentModel?.document;
        return doc?.kind === 'draft' && doc.access === 'write';
    }

    /** The name of the writable draft open, which a reference page can add to, or null. */
    get draftName(): string {
        return this.canEdit ? (this.selected?.name ?? null) : null;
    }

    /** Show the open blueprint's canvas, in design, from a reference page. */
    @action
    showEditor() {
        if (this.blueprintModel.mode !== 'design') this.blueprintModel.setMode('design');
        this.libraryOpen = false;
        this.editorView = 'canvas';
        this.view = 'blueprint';
    }

    /** The open blueprint's issues, or why it could not be opened. */
    @computed
    get issues(): BlueprintIssue[] {
        const {openIssues} = this;
        return openIssues.some(it => it.severity === 'error')
            ? openIssues
            : (this.blueprintModel?.issues ?? []);
    }

    /** The kind of blueprint the shell holds. */
    readonly type: BlueprintTypeSpec;

    constructor(config: BlueprintShellConfig) {
        super();
        const {storageKey} = config;
        this.persistWith = {localStorageKey: storageKey ?? 'blueprintsDesigner'};
        this.markPersist('selectedId', {path: `selectedId.${config.type.name}`});
        this.markPersist('recentIds', {path: `recentIds.${config.type.name}`});
        this.threadStore = new LocalThreadStore({
            storageKey: storageKey ? `${storageKey}.threads` : 'blueprints.designer.threads',
            seed: () => [],
            delayMs: 0
        });
        this.route = config.route ?? null;
        this.type = config.type;
        this.createProvider = config.createProvider ?? (() => new ServerDataProvider());
        this.repository = config.repository ?? createRepository(config.type.name);
        this.addReaction(
            {
                track: () => [
                    ...this.summaries.map(it => ({
                        id: it.id,
                        group: libraryGroup(it),
                        name: it.name,
                        description: it.description,
                        owner: it.owner === XH.getUsername() ? 'you' : it.owner,
                        status: it.access,
                        draftVersion: it.access === 'write' ? it.draftVersion : null,
                        publishedVersion: it.publishedVersion,
                        readOnly: it.access === 'read',
                        global: isGlobal(it),
                        updated: it.updated
                    })),
                    ...(this.summaries.some(it => libraryGroup(it) === 'Yours')
                        ? []
                        : [
                              {
                                  id: NONE_OF_YOURS,
                                  group: 'Yours',
                                  name: 'No blueprints of your own yet. Copy an example or start a new one.',
                                  placeholder: true
                              }
                          ])
                ],
                run: rows => {
                    this.listGridModel.loadData(rows);
                    // Group rows keep their render while their key holds, so counts would go stale.
                    this.listGridModel.agApi?.redrawRows();
                    this.listGridModel.selModel.select(this.selectedId);
                },
                equals: compareStructural,
                fireImmediately: true
            },
            {
                track: () => XH.routerState,
                run: state => this.followRoute(state?.name, state?.params)
            },
            {track: () => this.view, run: view => this.showPageInAddressBar(view)},
            {
                track: () => this.blueprintModel?.version,
                run: () => {
                    const doc = this.documentModel;
                    if (doc?.isDirty && !doc.isStale) this.saveAsync();
                },
                debounce: 1000
            }
        );
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        if (this.blueprintModel) return this.blueprintModel.loadAsync(loadSpec);

        const json = await XH.fetchJson({url: 'blueprints/catalog'}, {loadSpec});
        if (loadSpec.isStale) return;

        const {type} = this,
            catalog = new DataCatalog({...json, datasets: pick(json.datasets, type.datasets)});
        runInAction(() => {
            const blueprintModel = (this.blueprintModel = this.markManaged(
                new BlueprintModel({
                    catalog,
                    registry: type.createRegistry(),
                    dataProvider: this.createProvider(catalog),
                    mode: 'design',
                    access: 'write'
                })
            ));
            this.documentModel = this.markManaged(
                new BlueprintDocumentModel({blueprintModel, repository: this.repository})
            );
            this.designModel = this.markManaged(new BlueprintDesignModel({blueprintModel}));
            this.answerCatalog = new ChatUiCatalog({
                components: [chatUiStackSpec(), chatUiTextSpec(), chatUiCalloutSpec()],
                modes: ['document'],
                answers: {
                    registry: blueprintModel.registry,
                    dataCatalog: blueprintModel.catalog,
                    dataProvider: blueprintModel.dataProvider,
                    addToHost: addToBlueprint(blueprintModel)
                }
            });
            this.chatModel = this.markManaged(
                createArchitectChat(
                    blueprintModel,
                    this.answerCatalog,
                    () => {
                        this.saveConversation();
                        this.refreshUsageAsync();
                    },
                    () => ({
                        app: XH.clientAppCode,
                        feature: 'architect',
                        blueprintId: this.documentModel?.document?.id
                    }),
                    () => usageBlockedReason(this.usage),
                    featureRequestSink(() => ({
                        blueprintType: this.type.name,
                        blueprintId: this.documentModel?.document?.id ?? null,
                        app: XH.clientAppCode
                    })),
                    ops => {
                        revealEdit(this.designModel, ops);
                        this.editorView = 'canvas';
                    }
                )
            );
        });
        this.refreshUsageAsync();
        dropOldLibrary();

        await this.refreshSummariesAsync();
        const {name, params} = XH.routerState ?? {};
        if (name && name === this.route && params?.id) return this.openLinkAsync(params);
        const page = this.pageOfRoute(name);
        if (page) runInAction(() => (this.view = page));
    }

    /** Open a blueprint: the user's own as its draft, another's at its latest publish. */
    async selectAsync(id: string, force = false) {
        if (!force && id === this.selectedId && this.documentModel?.document?.id === id) {
            runInAction(() => (this.libraryOpen = false));
            this.showInAddressBar(id);
            return;
        }
        if (!(await this.readyToLeaveAsync())) {
            this.listGridModel.selModel.select(this.selectedId);
            return;
        }
        const prevId = this.documentModel?.document?.id;
        this.opening = this.opening.then(() => this.openAsync(id, prevId));
        await this.opening;
        this.showInAddressBar(id);
    }

    /**
     * Open a blueprint as a link names it: its id, `version` or `draft`, presets and variable
     * values. A link the user may not follow leaves its refusal in `openIssues`.
     */
    async openLinkAsync(params: BlueprintLinkParams) {
        this.lastLink = linkKey(params);
        if (!(await this.readyToLeaveAsync())) return;
        const prevId = this.documentModel?.document?.id;
        this.opening = this.opening.then(() => this.openAsync(params.id as string, prevId, params));
        await this.opening;
    }

    /**
     * Save the draft open, if it has unsaved edits. The document runs one write at a time, so
     * overlapping calls are safe. A stale draft is not saved: see {@link reloadDraftAsync} and
     * {@link saveAsNewAsync}.
     */
    async saveAsync() {
        const {documentModel} = this;
        if (!documentModel?.isDirty || !this.canEdit || documentModel.isStale) return;
        runInAction(() => (this.isSaving = true));
        try {
            const issues = await documentModel.saveDraftAsync();
            this.afterWrite(issues);
        } finally {
            runInAction(() => (this.isSaving = false));
        }
    }

    /** Reopen the stored draft of a stale blueprint, discarding the edits made here. */
    async reloadDraftAsync() {
        const issues = await this.documentModel.reloadAsync();
        runInAction(() => {
            this.openIssues = issues;
            this.saveIssues = [];
        });
        await this.refreshSummariesAsync();
    }

    /**
     * Save the blueprint open, with its unsaved edits, as a new blueprint, and open it. For a
     * stale draft, whose edits cannot save over the stored one. Returns its ID.
     */
    async saveAsNewAsync(name: string): Promise<string> {
        const {documentModel} = this,
            prevId = documentModel.document?.id,
            issues = await documentModel.createAsync(name),
            newId = documentModel.document?.id;
        if (!newId || newId === prevId) {
            runInAction(() => (this.saveIssues = issues));
            return null;
        }
        this.saveConversation(newId);
        await this.refreshSummariesAsync();
        runInAction(() => {
            this.selectedId = newId;
            this.openIssues = issues;
            this.saveIssues = [];
            this.listGridModel.selModel.select(newId);
        });
        await this.loadPublishesAsync();
        return newId;
    }

    async saveAsNewSelectedAsync() {
        const name = await this.promptNameAsync(
            'Save as a new blueprint',
            'Save',
            `${this.selected?.name} (mine)`
        );
        if (name) await this.saveAsNewAsync(name);
    }

    async publishAsync(note?: string) {
        const issues = await this.documentModel.publishAsync(note);
        this.afterWrite(issues);
        await this.loadPublishesAsync();
        if (!issues.some(it => it.severity === 'error')) {
            XH.successToast(`Published version ${this.documentModel.document.publishedVersion}.`);
        }
    }

    /** Set who may write and read the blueprint open, and refresh the library list. */
    async updateAccessAsync(spec: BlueprintAccessSpec) {
        await this.documentModel.updateAccessAsync(spec);
        await this.refreshSummariesAsync();
    }

    /** Create a blueprint, an empty dashboard by default, and open its draft. Returns its ID. */
    async createBlueprintAsync(
        name: string,
        blueprint: Blueprint = EMPTY_BLUEPRINT
    ): Promise<string> {
        await this.saveAsync();
        const record = await this.repository.createAsync({name, blueprint});
        await this.refreshSummariesAsync();
        await this.selectAsync(record.id);
        return record.id;
    }

    /**
     * Copy the blueprint open into a new one, from its latest publish, or from its draft if it has
     * none, and open the copy. Returns its ID.
     */
    async copyBlueprintAsync(name: string): Promise<string> {
        await this.saveAsync();
        const {selected} = this,
            from = selected.publishedVersion ? undefined : ({as: 'draft'} as const),
            record = await this.documentModel.copyAsync(name, from);
        await this.refreshSummariesAsync();
        await this.selectAsync(record.id);
        return record.id;
    }

    /** Delete the blueprint open, with its conversation, and return to the library. */
    async deleteBlueprintAsync() {
        const id = this.selectedId;
        await this.documentModel.deleteAsync();
        await this.threadStore.deleteThreadsAsync([id]).catch(() => {});
        await this.refreshSummariesAsync();
        runInAction(() => {
            this.selectedId = null;
            this.libraryOpen = true;
        });
        this.showLibraryInAddressBar();
    }

    /** A link to a blueprint at the app's route for one, or null if the app has none. */
    linkTo(id: string): string {
        const {route} = this;
        return route && XH.hasRoute(route)
            ? `${window.location.origin}${XH.router.buildUrl(route, {id})}`
            : null;
    }

    /** Copy a blueprint from its library row, staying on the library with the copy selected. */
    async copyFromLibraryAsync(id: string) {
        const summary = find(this.summaries, {id}),
            name = await this.promptNameAsync('Copy blueprint', 'Copy', `${summary.name} (copy)`);
        if (!name) return;
        const from = summary.publishedVersion ? undefined : ({as: 'draft'} as const),
            record = await this.repository.copyAsync(id, {name, from}).catchDefault();
        if (!record) return;
        await this.refreshSummariesAsync();
        this.listGridModel.selModel.select(record.id);
    }

    /** Rename a blueprint from its library row, staying on the library. */
    async renameFromLibraryAsync(id: string) {
        const summary = find(this.summaries, {id}),
            name = await this.promptNameAsync('Rename blueprint', 'Rename', summary.name);
        if (!name || name === summary.name) return;
        const renamed = await this.repository.renameAsync(id, {name}).catchDefault();
        if (renamed) await this.refreshSummariesAsync();
    }

    async shareFromLibraryAsync(id: string) {
        await this.selectAsync(id);
        runInAction(() => (this.shareOpen = true));
    }

    /** Delete a blueprint from its library row, staying on the library. */
    async deleteFromLibraryAsync(id: string) {
        const summary = find(this.summaries, {id});
        if (!summary || !(await this.confirmDeleteAsync(summary.name))) return;
        await this.repository.deleteAsync(id);
        await this.threadStore.deleteThreadsAsync([id]).catch(() => {});
        await this.refreshSummariesAsync();
        runInAction(() => {
            if (this.selectedId === id) this.selectedId = null;
            this.recentIds = this.recentIds.filter(it => it !== id);
        });
    }

    /** Show the library in place of the blueprint open, saving its draft first. */
    async showLibraryAsync() {
        if (this.libraryOpen || !(await this.readyToLeaveAsync())) return;
        runInAction(() => (this.libraryOpen = true));
        this.showLibraryInAddressBar();
    }

    async newBlueprintAsync() {
        const name = await this.promptNameAsync('New blueprint', 'Create', '');
        if (name) await this.createBlueprintAsync(name);
    }

    /** Rename the blueprint open. Rejects, with an `httpStatus` of 400, a name the user has. */
    async renameAsync(name: string) {
        await this.documentModel.renameAsync(name);
        await this.refreshSummariesAsync();
    }

    async renameSelectedAsync() {
        const {selected} = this,
            name = await this.promptNameAsync('Rename blueprint', 'Rename', selected.name);
        if (!name || name === selected.name) return;
        await this.renameAsync(name).catchDefault();
    }

    async copySelectedAsync() {
        const name = await this.promptNameAsync(
            'Copy blueprint',
            'Copy',
            `${this.selected.name} (copy)`
        );
        if (name) await this.copyBlueprintAsync(name);
    }

    async deleteSelectedAsync() {
        const {selected} = this;
        if (selected && (await this.confirmDeleteAsync(selected.name))) {
            await this.deleteBlueprintAsync();
        }
    }

    /** Open one of the blueprint's publishes, read-only, or its draft again. */
    async openVersionAsync(version: number | 'draft') {
        await this.saveAsync();
        const issues = await this.documentModel.openAsync(
            this.selectedId,
            version === 'draft' ? {as: 'draft'} : {as: 'publish', version}
        );
        runInAction(() => (this.openIssues = issues));
    }

    async clearConversationAsync() {
        const confirmed = await XH.confirm({
            title: 'Clear conversation',
            message: `Clear the Architect's conversation about "${this.selected?.name}"? The blueprint stays as it is.`,
            confirmProps: {text: 'Clear', intent: 'danger', outlined: true}
        });
        if (confirmed) this.clearConversation();
    }

    /** Show a reference page beside the Architect, or the blueprint again. */
    @action
    toggleView(view: DesignerView) {
        this.view = this.view === view ? 'blueprint' : view;
    }

    @action
    clearConversation() {
        this.chatModel.clear();
        this.saveConversation();
    }

    //------------------
    // Implementation
    //------------------
    private isOwnRow(record: {data: PlainObject}): boolean {
        return record?.data.group === 'Yours' && !record.data.placeholder;
    }

    private async openAsync(id: string, prevId: string, link?: BlueprintLinkParams) {
        const {documentModel, chatModel} = this;
        if (!documentModel) return;
        if (prevId) this.saveConversation(prevId);

        runInAction(() => {
            this.selectedId = id;
            this.view = 'blueprint';
            this.libraryOpen = false;
            this.saveIssues = [];
            this.recentIds = [id, ...this.recentIds.filter(it => it !== id)].slice(0, MAX_RECENT);
            this.listGridModel.selModel.select(id);
        });
        const summary = this.selected,
            issues = link
                ? (await documentModel.openLinkAsync(link)).issues
                : summary
                  ? await documentModel.openAsync(
                        id,
                        summary.access === 'write' ? {as: 'draft'} : {as: 'publish'}
                    )
                  : [];
        const messages = await this.threadStore
            .loadMessagesAsync({threadId: id})
            .then(it => it.messages)
            .catch(() => []);
        runInAction(() => {
            this.openIssues = issues;
            chatModel.loadMessages(messages, id);
        });
        await this.loadPublishesAsync();
    }

    // Open the link the address bar names, unless it is the one already open.
    private followRoute(name: string, params: BlueprintLinkParams) {
        if (!name || !this.documentModel) return;
        const page = this.pageOfRoute(name);
        if (page) {
            runInAction(() => (this.view = page));
            return;
        }
        if (name === this.libraryRoute) {
            runInAction(() => (this.view = 'blueprint'));
            this.showLibraryAsync();
            return;
        }
        if (name !== this.route || !params?.id) return;
        runInAction(() => (this.view = 'blueprint'));
        if (linkKey(params) !== this.lastLink) this.openLinkAsync(params);
    }

    // The reference page a route shows, or null for the blueprint page.
    private pageOfRoute(name: string): DesignerView {
        const lib = this.libraryRoute;
        if (!lib || !name) return null;
        if (name === `${lib}.catalog`) return 'catalog';
        if (name === `${lib}.registry`) return 'registry';
        return null;
    }

    // Show the page in the address bar: a reference page's route, or the library or blueprint open.
    private showPageInAddressBar(view: DesignerView) {
        const lib = this.libraryRoute;
        if (!lib) return;
        if (view !== 'blueprint') {
            const route = `${lib}.${view}`;
            if (XH.hasRoute(route) && XH.routerState?.name !== route) XH.navigate(route);
        } else if (this.libraryOpen || !this.documentModel?.document) {
            this.showLibraryInAddressBar();
        } else {
            this.showInAddressBar(this.documentModel.document.id);
        }
    }

    // The route that shows the library: the blueprint route's parent.
    private get libraryRoute(): string {
        return this.route?.replace(/\.[^.]+$/, '') ?? null;
    }

    private showLibraryInAddressBar() {
        const route = this.libraryRoute;
        this.lastLink = null;
        if (route && XH.hasRoute(route) && XH.routerState?.name !== route) XH.navigate(route);
    }

    // Show the blueprint open in the address bar, as the link that opens it as it is now.
    private showInAddressBar(id: string) {
        const {route} = this;
        if (!route || !XH.hasRoute(route)) return;
        const params = {
            id,
            ...(this.documentModel?.document?.kind === 'draft' ? {draft: true} : {})
        };
        this.lastLink = linkKey(params);
        XH.navigate(route, params, {replace: true});
    }

    // Save the draft open before leaving it, or confirm that its unsaved edits may go.
    private async readyToLeaveAsync(): Promise<boolean> {
        await this.saveAsync();
        const doc = this.documentModel;
        if (!doc?.isDirty) return true;
        return XH.confirm({
            title: 'Unsaved edits',
            message: doc.isStale
                ? `"${this.selected?.name}" was saved elsewhere, so your edits here could not save. Leave them? To keep them, choose Cancel, then Save as new.`
                : `Your edits to "${this.selected?.name}" are not saved. Leave them?`,
            confirmProps: {text: 'Leave them', intent: 'danger', outlined: true}
        });
    }

    /** Fetch the user's usage of the Claude API relay, if they may call it. */
    async refreshUsageAsync() {
        if (!XH.getUser().hasRole('TOOLBOX_LLM_USER')) return;
        try {
            const usage = await XH.fetchJson({url: 'llm/usage'});
            runInAction(() => (this.usage = usage));
        } catch (e) {
            XH.handleException(e, {showAlert: false});
        }
    }

    private async loadPublishesAsync() {
        const doc = this.documentModel.document,
            publishes =
                doc?.access === 'write' ? await this.repository.listPublishesAsync(doc.id) : [];
        runInAction(() => (this.publishes = publishes));
    }

    private async refreshSummariesAsync() {
        const summaries = await this.repository.listAsync();
        runInAction(() => (this.summaries = summaries));
    }

    // Reflect a save or publish in the library list, and keep its issues to show.
    @action
    private afterWrite(issues: BlueprintIssue[]) {
        this.saveIssues = issues;
        const doc = this.documentModel.document;
        if (!doc) return;
        this.summaries = this.summaries.map(it =>
            it.id === doc.id
                ? {
                      ...it,
                      draftVersion: doc.draftVersion,
                      publishedVersion: doc.publishedVersion,
                      updated: Date.now()
                  }
                : it
        );
    }

    private saveConversation(id: string = this.documentModel?.document?.id) {
        if (!id) return;
        this.threadStore.saveThread({id, messages: this.chatModel.getMessageSpecs()});
    }

    private confirmDeleteAsync(name: string): Promise<boolean> {
        return XH.confirm({
            title: 'Delete blueprint',
            message: `Delete "${name}", with its publishes and its conversation with the Architect?`,
            confirmProps: {text: 'Delete', intent: 'danger', outlined: true}
        });
    }

    private async promptNameAsync(title: string, action: string, initialValue: string) {
        const name = await XH.prompt<string>({
            title,
            icon: Icon.add(),
            message: 'Name the blueprint.',
            input: {rules: [required], initialValue},
            confirmProps: {text: action, intent: 'primary'}
        });
        return name ? name.trim() : null;
    }
}

function dropOldLibrary() {
    try {
        XH.localStorageService.remove(OLD_LIBRARY_KEY);
    } catch (e) {
        XH.handleException(e, {showAlert: false});
    }
}

function linkKey(params: BlueprintLinkParams): string {
    return JSON.stringify(
        Object.entries(params ?? {})
            .map(([k, v]) => [k, String(v)])
            .sort()
    );
}
