import type {
    Blueprint,
    BlueprintAccessSpec,
    BlueprintDataProvider,
    BlueprintIssue,
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
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import type {LoadSpec, PersistOptions} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
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
import {find} from 'lodash';
import {LocalThreadStore} from '../chatkit/integrations/LocalThreadStore';
import {createArchitectChat} from './architectChat';
import {createRepository} from './repository/createRepository';
import {ServerDataProvider} from './ServerDataProvider';
import {createToolboxRegistry} from './toolboxRegistry';

/** What the designer shows beside the Architect: the open blueprint, or a reference page. */
export type DesignerView = 'blueprint' | 'catalog' | 'registry';

/** A new blueprint: an empty dashboard, ready for widgets. */
const EMPTY_BLUEPRINT = {
    root: 'dashboard',
    elements: {dashboard: {component: 'dashCanvas', children: []}}
} as Blueprint;

// The local library this designer kept before blueprints moved to the server. Dropped on load.
const OLD_LIBRARY_KEY = 'blueprints.designer.library';

/**
 * The Blueprints designer: a library of blueprints in a {@link BlueprintRepository}, each with its
 * own conversation with the Architect. One {@link BlueprintModel}, opened through a
 * {@link BlueprintDocumentModel}, and one Architect `ChatModel` hold the selected blueprint, once
 * the server's Data Catalog loads. The user's own blueprints open as drafts, which save as they
 * change. Other users' blueprints open at their latest publish, read-only.
 */
export class BlueprintsPanelModel extends HoistModel {
    override persistWith: PersistOptions = {localStorageKey: 'blueprintsDesigner'};

    /** The blueprints the user may read, as the repository lists them. */
    @observableRef accessor summaries: BlueprintSummary[] = [];
    @bindable @persist accessor selectedId: string = null;
    @bindable accessor view: DesignerView = 'blueprint';

    /** Issues from opening the selected blueprint. Errors mean it could not be shown. */
    @observableRef accessor openIssues: BlueprintIssue[] = [];

    /** Issues from the last save or publish, such as a stale draft. */
    @observableRef accessor saveIssues: BlueprintIssue[] = [];

    /** Every publish of the blueprint open, oldest first. */
    @observableRef accessor publishes: BlueprintPublish[] = [];

    @observable accessor isSaving = false;

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

    /** Each blueprint's conversation with the Architect, by blueprint ID. */
    readonly threadStore = new LocalThreadStore({
        storageKey: 'blueprints.designer.threads',
        seed: () => [],
        delayMs: 0
    });

    @managed listGridModel = new GridModel({
        hideHeaders: true,
        emptyText: 'No blueprints',
        columns: [
            {field: 'name', flex: 1},
            {
                field: 'global',
                width: 28,
                align: 'center',
                renderer: (v: boolean) => (v ? Icon.globe({title: 'Everyone can view'}) : null)
            },
            {
                field: 'status',
                width: 60,
                align: 'right',
                renderer: (v: string) =>
                    v === 'read' ? Icon.lock({title: 'Read only'}) : v ? v : null
            }
        ]
    });

    private createProvider: (catalog: DataCatalog) => BlueprintDataProvider;
    private opening: Promise<void> = Promise.resolve();

    get selected(): BlueprintSummary {
        return find(this.summaries, {id: this.selectedId}) ?? null;
    }

    /** True if the blueprint open is a draft the user may edit. */
    get canEdit(): boolean {
        const doc = this.documentModel?.document;
        return doc?.kind === 'draft' && doc.access === 'write';
    }

    /** The open blueprint's issues, or why it could not be opened. */
    @computed
    get issues(): BlueprintIssue[] {
        const {openIssues} = this;
        return openIssues.some(it => it.severity === 'error')
            ? openIssues
            : (this.blueprintModel?.issues ?? []);
    }

    constructor(
        config: {
            createProvider?: (catalog: DataCatalog) => BlueprintDataProvider;
            repository?: BlueprintRepository;
        } = {}
    ) {
        super();
        this.createProvider = config.createProvider ?? (() => new ServerDataProvider());
        this.repository = config.repository ?? createRepository();
        this.addReaction(
            {
                track: () =>
                    this.summaries.map(it => ({
                        id: it.id,
                        name: it.name,
                        status:
                            it.access === 'read' ? 'read' : it.publishedVersion ? null : 'draft',
                        global: isGlobal(it)
                    })),
                run: rows => {
                    this.listGridModel.loadData(rows);
                    this.listGridModel.selModel.select(this.selectedId);
                },
                equals: compareStructural,
                fireImmediately: true
            },
            {
                track: () => this.listGridModel.selectedId as string,
                run: id => {
                    if (id && id !== this.selectedId) this.selectAsync(id);
                }
            },
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

        const catalog = new DataCatalog(json);
        runInAction(() => {
            const blueprintModel = (this.blueprintModel = this.markManaged(
                new BlueprintModel({
                    catalog,
                    registry: createToolboxRegistry(),
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
                createArchitectChat(blueprintModel, this.answerCatalog, () =>
                    this.saveConversation()
                )
            );
        });
        dropOldLibrary();

        await this.refreshSummariesAsync();
        const first = this.selected ? this.selectedId : this.summaries[0]?.id;
        if (first) await this.selectAsync(first, true);
    }

    /** Open a blueprint: the user's own as its draft, another's at its latest publish. */
    async selectAsync(id: string, force = false) {
        if (!force && id === this.selectedId && this.documentModel?.document?.id === id) return;
        if (!(await this.readyToLeaveAsync())) {
            this.listGridModel.selModel.select(this.selectedId);
            return;
        }
        const prevId = this.documentModel?.document?.id;
        this.opening = this.opening.then(() => this.openAsync(id, prevId));
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

    /** Delete the blueprint open, with its conversation, and open the first left. */
    async deleteBlueprintAsync() {
        const id = this.selectedId;
        await this.documentModel.deleteAsync();
        await this.threadStore.deleteThreadsAsync([id]).catch(() => {});
        await this.refreshSummariesAsync();
        const next = this.summaries[0]?.id;
        if (next) {
            await this.selectAsync(next, true);
        } else {
            runInAction(() => (this.selectedId = null));
        }
    }

    async newBlueprintAsync() {
        const name = await this.promptNameAsync('New blueprint', 'Create', '');
        if (name) await this.createBlueprintAsync(name);
    }

    async copySelectedAsync() {
        const name = await this.promptNameAsync(
            'Copy blueprint',
            'Copy',
            `${this.selected.name} (copy)`
        );
        if (name) await this.copyBlueprintAsync(name);
    }

    async publishSelectedAsync() {
        const note = await XH.prompt<string>({
            title: 'Publish',
            icon: Icon.upload(),
            message: `Publish the draft of "${this.selected.name}" as version ${(this.selected.publishedVersion ?? 0) + 1}. Readers run the latest publish.`,
            input: {initialValue: '', item: undefined},
            confirmProps: {text: 'Publish', intent: 'primary'}
        });
        if (note !== false) await this.publishAsync(note || undefined);
    }

    async deleteSelectedAsync() {
        const {selected} = this;
        if (!selected) return;
        const confirmed = await XH.confirm({
            title: 'Delete blueprint',
            message: `Delete "${selected.name}", with its publishes and its conversation with the Architect?`,
            confirmProps: {text: 'Delete', intent: 'danger', outlined: true}
        });
        if (confirmed) await this.deleteBlueprintAsync();
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
    private async openAsync(id: string, prevId: string) {
        const {documentModel, chatModel} = this;
        if (!documentModel) return;
        if (prevId) this.saveConversation(prevId);

        runInAction(() => {
            this.selectedId = id;
            this.view = 'blueprint';
            this.saveIssues = [];
            this.listGridModel.selModel.select(id);
        });
        const summary = this.selected,
            issues = summary
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
