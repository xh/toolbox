import type {Blueprint, BlueprintDataProvider, BlueprintIssue} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintDesignModel, BlueprintModel, DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import type {ChatMessageSpec, ChatModel} from '@xh/hoist-chat-kit/core';
import {
    chatUiCalloutSpec,
    chatUiStackSpec,
    chatUiTextSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';
import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {addToBlueprint} from '@xh/hoist-chat-kit/genui/architect';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import type {LoadSpec, PersistOptions, PlainObject} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {Icon} from '@xh/hoist/icon';
import {
    action,
    bindable,
    compareStructural,
    computed,
    observableRef,
    runInAction
} from '@xh/hoist/mobx';
import {cloneDeep, find} from 'lodash';
import {createArchitectChat} from './architectChat';
import {migrateBlueprint} from './migrateBlueprint';
import {ServerDataProvider} from './ServerDataProvider';
import {createToolboxRegistry} from './toolboxRegistry';
import p1 from './scenarios/p1-one-grid.json';
import p2 from './scenarios/p2-linked-dashboard.json';
import p3 from './scenarios/p3-morning-report.json';
import p5 from './scenarios/p5-risk-report.json';
import w1 from './scenarios/w1-one-city.json';
import w2 from './scenarios/w2-two-cities.json';

/** What the designer shows beside the Architect: the open blueprint, or a reference page. */
export type DesignerView = 'blueprint' | 'catalog' | 'registry';

/** A blueprint in the designer's library, with its conversation with the Architect. */
export interface BlueprintRecord {
    id: string;
    name: string;
    /** Null for an empty blueprint. */
    blueprint: PlainObject;
    messages: ChatMessageSpec[];
}

/** The library a new user starts with, and returns to on a reset. */
export const PRESETS: BlueprintRecord[] = [
    {id: 'p1', name: 'P1. One grid', blueprint: p1},
    {id: 'p2', name: 'P2. A linked dashboard', blueprint: p2},
    {id: 'p3', name: 'P3. A morning report', blueprint: p3},
    {id: 'p5', name: 'P5. A risk and stress report', blueprint: p5},
    {id: 'w1', name: 'W1. Weather for one city', blueprint: w1},
    {id: 'w2', name: 'W2. Two cities side by side', blueprint: w2}
].map(it => ({...it, messages: []}));

const LIBRARY_KEY = 'blueprints.designer.library';

/**
 * The Blueprints designer: a library of blueprints in local storage, each with its own
 * conversation with the Architect. One {@link BlueprintModel} and one Architect `ChatModel` open
 * the selected blueprint, once the server's Data Catalog loads.
 */
export class BlueprintsPanelModel extends HoistModel {
    override persistWith: PersistOptions = {localStorageKey: 'blueprintsDesigner'};

    @observableRef accessor records: BlueprintRecord[] = readLibrary();
    @bindable @persist accessor selectedId: string = null;
    @bindable accessor view: DesignerView = 'blueprint';

    /** Issues from opening the selected blueprint. Errors mean it could not be shown. */
    @observableRef accessor openIssues: BlueprintIssue[] = [];

    /** Null until the catalog loads. */
    @observableRef accessor blueprintModel: BlueprintModel = null;

    /** Selection and structural edits on the open blueprint, in design mode. */
    @observableRef accessor designModel: BlueprintDesignModel = null;

    /** The Architect's answers: text and layout around the blueprint's own widgets and data. */
    @observableRef accessor answerCatalog: ChatUiCatalog = null;

    /** The Architect, holding the selected blueprint's conversation. Null until the catalog loads. */
    @observableRef accessor chatModel: ChatModel = null;

    @managed listGridModel = new GridModel({
        hideHeaders: true,
        emptyText: 'No blueprints',
        columns: [{field: 'name', flex: 1}]
    });

    private createProvider: (catalog: DataCatalog) => BlueprintDataProvider;

    get selected(): BlueprintRecord {
        return find(this.records, {id: this.selectedId}) ?? null;
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
        createProvider: (catalog: DataCatalog) => BlueprintDataProvider = () =>
            new ServerDataProvider()
    ) {
        super();
        this.createProvider = createProvider;
        this.addReaction(
            {
                track: () => this.selectedId,
                run: (id, prevId) => this.open(id, prevId)
            },
            {
                track: () => this.records,
                run: records => XH.localStorageService.set(LIBRARY_KEY, records)
            },
            {
                track: () => this.records.map(({id, name}) => ({id, name})),
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
                    if (id) this.selectedId = id;
                }
            },
            {
                track: () => this.blueprintModel?.blueprint,
                run: bp => {
                    if (bp) this.update(this.selectedId, {blueprint: bp});
                }
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
                    // The designer is a design surface: widget changes are edits.
                    mode: 'design',
                    access: 'write'
                })
            ));
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
        this.select(this.selected ? this.selectedId : this.records[0]?.id);
    }

    async newBlueprintAsync() {
        const name = await XH.prompt<string>({
            title: 'New blueprint',
            icon: Icon.add(),
            message: 'Name the blueprint.',
            input: {rules: [required]},
            confirmProps: {text: 'Create', intent: 'primary'}
        });
        if (name) this.addBlueprint(name.trim());
    }

    async deleteSelectedAsync() {
        const {selected} = this;
        if (!selected) return;
        const confirmed = await XH.confirm({
            title: 'Delete blueprint',
            message: `Delete "${selected.name}" and its conversation with the Architect?`,
            confirmProps: {text: 'Delete', intent: 'danger', outlined: true}
        });
        if (confirmed) this.deleteBlueprint(selected.id);
    }

    async resetLibraryAsync() {
        const confirmed = await XH.confirm({
            title: 'Reset to presets',
            message: 'Replace every blueprint and conversation with the presets?',
            confirmProps: {text: 'Reset', intent: 'danger', outlined: true}
        });
        if (confirmed) this.resetLibrary();
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

    /** Add a blueprint, empty or a copy of one given, and open it. */
    @action
    addBlueprint(name: string, blueprint: PlainObject = null): BlueprintRecord {
        const ret: BlueprintRecord = {id: XH.genId(), name, blueprint, messages: []};
        this.records = [...this.records, ret];
        this.select(ret.id);
        return ret;
    }

    @action
    deleteBlueprint(id: string) {
        this.records = this.records.filter(it => it.id !== id);
        if (id === this.selectedId) this.select(this.records[0]?.id);
    }

    /** Return to the presets, with no conversations. */
    @action
    resetLibrary() {
        this.chatModel?.clear();
        this.records = cloneDeep(PRESETS);
        this.select(PRESETS[0].id);
    }

    @action
    clearConversation() {
        this.chatModel.clear();
        this.saveConversation();
    }

    //------------------
    // Implementation
    //------------------
    /** Open a blueprint, even the one already selected. */
    @action
    private select(id: string) {
        if (id === this.selectedId) {
            this.open(id);
        } else {
            this.selectedId = id;
        }
    }

    @action
    private open(id: string, prevId?: string) {
        const {blueprintModel, chatModel} = this;
        if (!blueprintModel) return;
        if (prevId) this.saveConversation(prevId);

        const rec = this.selected;
        this.view = 'blueprint';
        this.listGridModel.selModel.select(id);
        blueprintModel.clear();
        this.openIssues = rec?.blueprint
            ? blueprintModel.setBlueprint(rec.blueprint as Blueprint)
            : [];
        chatModel.loadMessages(rec?.messages ?? [], id);
    }

    private saveConversation(id: string = this.selectedId) {
        this.update(id, {messages: this.chatModel.getMessageSpecs()});
    }

    @action
    private update(id: string, changes: Partial<BlueprintRecord>) {
        this.records = this.records.map(it => (it.id === id ? {...it, ...changes} : it));
    }
}

function readLibrary(): BlueprintRecord[] {
    try {
        const stored: BlueprintRecord[] = XH.localStorageService.get(LIBRARY_KEY, null);
        return stored
            ? stored.map(it => ({...it, blueprint: migrateBlueprint(it.blueprint)}))
            : cloneDeep(PRESETS);
    } catch (e) {
        XH.handleException(e, {showAlert: false});
        return cloneDeep(PRESETS);
    }
}
