import type {
    Blueprint,
    BlueprintIssue,
    BlueprintPublish,
    BlueprintVariable
} from '@xh/hoist-chat-kit/blueprint';
import {diffBlueprints} from '@xh/hoist-chat-kit/blueprint';
import {hbox, span} from '@xh/hoist/cmp/layout';
import {badge} from '@xh/hoist/cmp/badge';
import {GridModel} from '@xh/hoist/cmp/grid';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, lookup, managed, persist, XH} from '@xh/hoist/core';
import type {PersistOptions} from '@xh/hoist/core';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {fmtCompactDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, observable, observableRef, runInAction} from '@xh/hoist/mobx';
import {applyJsonEdit} from '../applyJsonEdit';
import {BlueprintShellModel} from '../BlueprintShellModel';
import type {EditorView} from '../BlueprintShellModel';
import {tag} from '../cards';
import {md} from '../markdown';
import {compareRows} from './compareRows';
import {diffRows, renamesBetween} from './publishCompare';
import type {DiffRow} from './publishCompare';
import {historyTimeline, revealEdit} from './historyTimeline';
import type {TimelineRow} from './historyTimeline';

export type DockTab = 'architect' | 'structure' | 'add' | 'history' | 'values';

export interface DockTabSpec {
    id: DockTab;
    title: string;
    icon: ReturnType<typeof Icon.ai>;
}

const DESIGN_TABS: DockTabSpec[] = [
    {id: 'architect', title: 'Architect', icon: Icon.ai()},
    {id: 'structure', title: 'Structure', icon: Icon.treeList()},
    {id: 'add', title: 'Add', icon: Icon.add()},
    {id: 'history', title: 'History', icon: Icon.history()}
];

const RUN_TABS: DockTabSpec[] = [
    {id: 'architect', title: 'Architect', icon: Icon.ai()},
    {id: 'values', title: 'Values', icon: Icon.options()},
    {id: 'history', title: 'History', icon: Icon.history()}
];

/**
 * The open blueprint's editor: the left dock and its tabs, the Inspector, the History timeline,
 * and the JSON view's draft.
 */
export class EditorModel extends HoistModel {
    override persistWith: PersistOptions = {localStorageKey: 'blueprintsDock'};

    @lookup(BlueprintShellModel) shell: BlueprintShellModel;

    @bindable @persist accessor designTab: DockTab = 'architect';
    @bindable @persist accessor runTab: DockTab = 'architect';

    /** The blueprint as JSON, to edit. Follows the open blueprint until edited. */
    @bindable accessor draft: string = '';

    /** Why the draft is not JSON, if it isn't. */
    @observable accessor parseError: string = null;

    /** The errors that refused the last JSON apply. */
    @observableRef accessor applyIssues: BlueprintIssue[] = [];

    /** The publish the JSON view compares from, or null when it isn't comparing. */
    @observable accessor compareVersion: number = null;

    /** The version compared to: a later publish, or the blueprint open. */
    @observable accessor compareTo: number | 'open' = 'open';

    /** The comparison's changes, part by part. */
    @observableRef accessor diff: DiffRow[] = [];

    /** The publish whose note, label and pin the details dialog edits, or null. */
    @observableRef accessor editingPublish: BlueprintPublish = null;
    @bindable accessor publishNote = '';
    @bindable accessor publishLabel = '';
    @bindable accessor publishPinned = false;

    // When each edit since the open was made, by version.
    @observableRef private accessor stamps: Record<number, number> = {};

    @managed dockPanelModel = new PanelModel({
        side: 'left',
        defaultSize: 320,
        minSize: 280,
        collapsible: true,
        showCollapsedStrip: false,
        showSplitterCollapseButton: false,
        showHeaderCollapseButton: false,
        persistWith: {localStorageKey: 'blueprintsDock', path: 'panel'}
    });

    @managed inspectorPanelModel = new PanelModel({
        side: 'right',
        defaultSize: 360,
        minSize: 280,
        collapsible: true,
        persistWith: {localStorageKey: 'blueprintsInspector'}
    });

    /**
     * The views, as tabs for the view bar's switcher only: the shell's `editorView` is the view
     * shown, and the two follow each other. Preview is a writer's draft's only.
     */
    @managed viewTabsModel = new TabContainerModel({
        tabs: [
            {id: 'canvas', title: 'Canvas', icon: Icon.gridLarge(), content: () => null},
            {id: 'map', title: 'Map', icon: Icon.treeList(), content: () => null},
            {id: 'json', title: 'JSON', icon: Icon.code(), content: () => null},
            {
                id: 'preview',
                title: 'Preview',
                icon: Icon.eye(),
                tooltip: "The reader's view (P)",
                content: () => null
            }
        ]
    });

    /** True while the dialog that makes a preset group shows. */
    @bindable accessor presetsDialogOpen = false;

    @managed compareGridModel = new GridModel({
        store: {idSpec: 'path'},
        emptyText: 'No changes.',
        columns: [
            {
                field: 'change',
                width: 90,
                rendererIsComplex: true,
                renderer: v =>
                    badge({
                        intent: v === 'added' ? 'success' : v === 'removed' ? 'danger' : 'primary',
                        children: v
                    })
            },
            {field: 'path', flex: 1, minWidth: 200, cellClass: 'tb-editor__mono'},
            {field: 'before', flex: 1, minWidth: 160, cellClass: 'tb-editor__mono', tooltip: true},
            {field: 'after', flex: 1, minWidth: 160, cellClass: 'tb-editor__mono', tooltip: true}
        ]
    });

    @managed valuesGridModel = new GridModel({
        store: {idSpec: 'name'},
        sortBy: 'name',
        emptyText: 'No variables. Variables link widgets: one sets a value that others read.',
        rowClassFn: rec => (rec?.data.isSet ? null : 'tb-editor__default'),
        contextMenu: [
            {
                text: 'Reset to default',
                icon: Icon.reset(),
                recordsRequired: 1,
                displayFn: ({record}) => ({disabled: !record?.data.isSet}),
                actionFn: ({record}) => this.shell.blueprintModel.resetVariable(record.id as string)
            }
        ],
        columns: [
            {
                field: 'name',
                width: 120,
                tooltip: (v, {record}) => `${v}: ${record.data.type}`
            },
            {field: 'type', hidden: true},
            {field: 'value', flex: 1, minWidth: 80, tooltip: true},
            {field: 'setBy', headerName: 'Set by', flex: 1, minWidth: 80, tooltip: true},
            {field: 'isSet', hidden: true}
        ]
    });

    @managed historyGridModel = new GridModel({
        store: {idSpec: 'id'},
        sortBy: 'time|desc',
        hideHeaders: true,
        emptyText: 'No edits yet. Edits by you and the Architect show here, newest first.',
        // Rules, not a class function, so a row restyles when its pin or undo state changes.
        rowClassRules: {
            'tb-history__undone': ({data}) => !!data?.data.undone,
            'tb-history__publish': ({data}) => data?.data.kind === 'publish',
            'tb-history__pinned': ({data}) => data?.data.kind === 'publish' && !!data.data.pinned
        },
        columns: [
            {field: 'kind', hidden: true},
            {field: 'version', hidden: true},
            {field: 'undone', hidden: true},
            {field: 'note', hidden: true},
            {field: 'label', hidden: true},
            {field: 'pinned', hidden: true},
            {field: 'ops', hidden: true},
            {
                field: 'author',
                width: 32,
                align: 'center',
                renderer: (v, {record}) =>
                    record.data.kind === 'publish'
                        ? Icon.upload({title: v ? `Published by ${v}` : 'Published'})
                        : v === 'architect'
                          ? Icon.ai({title: 'Architect'})
                          : Icon.user({title: v})
            },
            {
                field: 'description',
                flex: 1,
                minWidth: 140,
                rendererIsComplex: true,
                renderer: (v, {record}) =>
                    hbox({
                        className: 'tb-history__description',
                        children: [
                            record.data.pinned ? Icon.pin({className: 'xh-intent-primary'}) : null,
                            span({className: 'tb-history__text', children: md(v as string)}),
                            record.data.label ? tag(record.data.label, 'primary') : null,
                            record.data.note
                                ? span({className: 'tb-history__note', children: record.data.note})
                                : null
                        ]
                    }),
                tooltip: (v, {record}) => record.data.note ?? v
            },
            {
                field: 'time',
                width: 84,
                align: 'right',
                renderer: v => (v ? fmtCompactDate(v) : null)
            },
            {
                ...actionCol,
                width: 140,
                actionsShowOnHoverOnly: true,
                actions: [
                    {
                        icon: Icon.crosshairs(),
                        tooltip: 'Show what this edit changed',
                        displayFn: ({record}) => ({
                            hidden: record?.data.kind !== 'edit' || !this.isDesigning
                        }),
                        actionFn: ({record}) => this.showEdit(record.data as TimelineRow)
                    },
                    {
                        icon: Icon.diff(),
                        tooltip: 'Compare this version with the blueprint open',
                        displayFn: ({record}) => ({hidden: record?.data.kind !== 'publish'}),
                        actionFn: ({record}) => this.compareAsync(record.data.version as number)
                    },
                    {
                        icon: Icon.openExternal(),
                        tooltip: 'Open this version, read-only',
                        displayFn: ({record}) => ({hidden: record?.data.kind !== 'publish'}),
                        actionFn: ({record}) =>
                            this.shell.openVersionAsync(record.data.version as number)
                    },
                    {
                        icon: Icon.reset(),
                        tooltip: 'Restore this version to the draft',
                        displayFn: ({record}) => ({
                            hidden: record?.data.kind !== 'publish' || !this.canRestore
                        }),
                        actionFn: ({record}) =>
                            this.shell.restoreVersionAsync(record.data.version as number)
                    },
                    {
                        icon: Icon.upload(),
                        tooltip: 'Republish this version, to roll readers back to it',
                        displayFn: ({record}) => ({
                            hidden: record?.data.kind !== 'publish' || !this.shell.canRollback
                        }),
                        actionFn: ({record}) =>
                            this.shell.rollbackAsync(record.data.version as number)
                    },
                    {
                        icon: Icon.edit(),
                        tooltip: 'Edit its note, label and pin',
                        displayFn: ({record}) => ({
                            hidden:
                                record?.data.kind !== 'publish' ||
                                !this.shell.documentModel.canUpdatePublishes
                        }),
                        actionFn: ({record}) =>
                            this.openPublishEditor(record.data.version as number)
                    }
                ]
            }
        ]
    });

    /** True if the user may restore a publish into the draft: they may write the blueprint. */
    get canRestore(): boolean {
        return this.shell.documentModel.document?.access === 'write';
    }

    /** True while the open blueprint is a writable draft in design mode. */
    @computed
    get isDesigning(): boolean {
        const {mode, access} = this.shell.blueprintModel;
        return this.shell.canEdit && mode === 'design' && access === 'write';
    }

    /** False while there is no blueprint, or a failed open left the previous one in the model. */
    get shown(): boolean {
        const {blueprintModel, openIssues} = this.shell;
        return !!blueprintModel.blueprint && !openIssues.some(it => it.severity === 'error');
    }

    get dockTabs(): DockTabSpec[] {
        return this.isDesigning ? DESIGN_TABS : RUN_TABS;
    }

    /** The dock's tab, from those of the mode. */
    get dockTab(): DockTab {
        const tab = this.isDesigning ? this.designTab : this.runTab;
        return this.dockTabs.some(it => it.id === tab) ? tab : 'architect';
    }

    get dockOpen(): boolean {
        return !this.dockPanelModel.collapsed;
    }

    @computed
    get currentJson(): string {
        const {blueprint} = this.shell.blueprintModel;
        return blueprint ? JSON.stringify(blueprint, null, 2) : '';
    }

    @computed
    get isJsonDirty(): boolean {
        return this.draft !== this.currentJson;
    }

    /** One line on why the last JSON apply failed, if it did. */
    @computed
    get applyError(): string {
        if (this.parseError) return `Not valid JSON: ${this.parseError}`;
        const [first] = this.applyIssues,
            n = this.applyIssues.length;
        return first ? `Refused: ${first.message}${n > 1 ? ` And ${n - 1} more.` : ''}` : null;
    }

    /** Show a dock tab, or close the dock if it already shows it. */
    @action
    toggleTab(id: DockTab) {
        const {dockPanelModel} = this;
        if (this.dockOpen && this.dockTab === id) {
            dockPanelModel.setCollapsed(true);
            return;
        }
        if (this.isDesigning) {
            this.designTab = id;
        } else {
            this.runTab = id;
        }
        dockPanelModel.setCollapsed(false);
    }

    /** Show a dock tab, opening the dock if closed. */
    @action
    showTab(id: DockTab) {
        if (this.isDesigning) {
            this.designTab = id;
        } else {
            this.runTab = id;
        }
        this.dockPanelModel.setCollapsed(false);
    }

    /**
     * Open the dock on the Architect, with its composer focused once it shows. Both modes' tabs
     * take it, as a new blueprint may not yet be in design.
     */
    @action
    askArchitect() {
        this.designTab = 'architect';
        this.runTab = 'architect';
        this.dockPanelModel.setCollapsed(false);
        const {composerModel} = this.shell.chatModel;
        if (composerModel.inputRef.current) {
            composerModel.focus();
        } else {
            this.addReaction({
                when: () => !!composerModel.inputRef.current,
                run: () => composerModel.focus()
            });
        }
    }

    /** Add to a section of Structure, from its "+". */
    addToSection(section: 'element' | 'source' | 'variable' | 'preset') {
        const {shell} = this;
        switch (section) {
            case 'element':
                this.showTab('add');
                break;
            case 'source':
                shell.view = 'catalog';
                break;
            case 'variable': {
                const error = shell.designModel
                    .addVariable()
                    .issues.find(it => it.severity === 'error');
                if (error) XH.dangerToast(error.message);
                break;
            }
            case 'preset':
                this.presetsDialogOpen = true;
                if (this.inspectorPanelModel.collapsed)
                    this.inspectorPanelModel.setCollapsed(false);
                break;
        }
    }

    /**
     * Show in the JSON view how a publish differs from a later one, or from the blueprint open: a
     * summary by part, then each changed value.
     */
    async compareAsync(from: number, to: number | 'open' = 'open') {
        const {shell} = this,
            {documentModel} = shell,
            doc = documentModel.document,
            openPublish = (version: number) =>
                shell.repository
                    .openAsync(doc.id, {as: 'publish', version})
                    .then(it => it?.blueprint),
            [a, b] =
                (await Promise.all([
                    openPublish(from),
                    to === 'open'
                        ? Promise.resolve(shell.blueprintModel.blueprint)
                        : openPublish(to)
                ]).catchDefault()) ?? [];
        if (!a || !b) return;
        const target = to === 'open' ? (doc.kind === 'draft' ? 'draft' : doc.version) : to,
            renames = renamesBetween(
                shell.publishes,
                from,
                target,
                target === 'draft' ? documentModel.pendingRenames : []
            );
        this.compareGridModel.loadData(compareRows(a, b as Blueprint));
        runInAction(() => {
            this.compareVersion = from;
            this.compareTo = to;
            this.diff = diffRows(diffBlueprints(a, b as Blueprint, renames));
            shell.editorView = 'json';
        });
    }

    /** True if a comparison's changes can be revealed: it compares to the draft, in design. */
    get canRevealDiff(): boolean {
        return this.compareTo === 'open' && this.isDesigning;
    }

    /** Select what a change names on the canvas. */
    revealDiff(row: DiffRow) {
        if (!row.id || row.kind === 'other' || row.kind === 'format' || row.change === 'removed') {
            return;
        }
        this.shell.designModel.select({kind: row.kind, id: row.id});
        this.shell.editorView = 'canvas';
    }

    @action
    closeCompare() {
        this.compareVersion = null;
        this.compareTo = 'open';
        this.diff = [];
    }

    @action
    openPublishEditor(version: number) {
        const publish = this.shell.publishes.find(it => it.version === version);
        if (!publish) return;
        this.editingPublish = publish;
        this.publishNote = publish.note ?? '';
        this.publishLabel = publish.label ?? '';
        this.publishPinned = !!publish.pinned;
    }

    @action
    closePublishEditor() {
        this.editingPublish = null;
    }

    async savePublishEditAsync() {
        const {editingPublish, publishNote, publishLabel, publishPinned} = this;
        if (!editingPublish) return;
        await this.shell.updatePublishAsync(editingPublish.version, {
            note: publishNote,
            label: publishLabel,
            pinned: publishPinned
        });
        this.closePublishEditor();
    }

    /** Apply the JSON draft as one edit. With errors, nothing changes. */
    @action
    applyDraft() {
        const {parseError, issues} = applyJsonEdit(this.shell.blueprintModel, this.draft);
        this.parseError = parseError ?? null;
        this.applyIssues = issues;
    }

    @action
    revertDraft() {
        this.draft = this.currentJson;
        this.parseError = null;
        this.applyIssues = [];
    }

    /** Select what an edit changed, if it is still there, on the canvas. */
    showEdit(row: TimelineRow) {
        revealEdit(this.shell.designModel, row.ops);
        this.shell.editorView = 'canvas';
        if (this.inspectorPanelModel.collapsed) this.inspectorPanelModel.setCollapsed(false);
    }

    override destroy() {
        const {designModel} = this.shell ?? {};
        if (designModel?.onRequestAdd === this.requestAdd) designModel.onRequestAdd = null;
        if (designModel?.onPreview === this.preview) designModel.onPreview = null;
        super.destroy();
    }

    // Opens the dock on Add, for the design keys' `/`.
    private readonly requestAdd = () => this.showTab('add');

    // Goes to Preview and back, for the design keys' P. Only a writer's draft has a Preview.
    private readonly preview = () => {
        if (this.shell.canEdit) this.shell.togglePreview();
    };

    override onLinked() {
        const {shell} = this,
            {blueprintModel} = shell;
        shell.designModel.onRequestAdd = this.requestAdd;
        shell.designModel.onPreview = this.preview;
        if (shell.askArchitectOnOpen) {
            shell.askArchitectOnOpen = false;
            this.askArchitect();
        }
        this.addReaction(
            {
                track: () => shell.editorView,
                run: view => {
                    if (this.viewTabsModel.activeTabId !== view)
                        this.viewTabsModel.activateTab(view);
                },
                fireImmediately: true
            },
            {
                track: () => this.viewTabsModel.activeTabId,
                run: id => {
                    if (shell.editorView !== id) shell.editorView = id as EditorView;
                }
            },
            {
                track: () => shell.canEdit,
                run: canEdit =>
                    (this.viewTabsModel.findTab('preview').excludeFromSwitcher = !canEdit),
                fireImmediately: true
            },
            {
                track: () => this.currentJson,
                run: (json, prev) => {
                    if (this.draft === (prev ?? '')) this.draft = json;
                },
                fireImmediately: true
            },
            {
                track: () => blueprintModel.history,
                run: history => {
                    const now = Date.now(),
                        stamps = {};
                    history.forEach(it => (stamps[it.version] = this.stamps[it.version] ?? now));
                    this.stamps = stamps;
                },
                fireImmediately: true
            },
            {
                // A row's actions show by these, which the grid does not observe.
                track: () => {
                    const {documentModel} = shell;
                    return [
                        documentModel.document?.kind,
                        documentModel.document?.access,
                        documentModel.canUpdatePublishes,
                        shell.canRollback,
                        this.isDesigning
                    ];
                },
                run: () => this.historyGridModel.agApi?.refreshCells({force: true})
            },
            {
                track: () => [blueprintModel.history, shell.publishes, this.stamps],
                run: () =>
                    this.historyGridModel.loadData(
                        historyTimeline(blueprintModel.history, shell.publishes, this.stamps)
                    ),
                fireImmediately: true
            },
            {
                track: () => blueprintModel.variables.map(v => [v, v.value, v.isSet]),
                run: () => this.valuesGridModel.loadData(blueprintModel.variables.map(toValueRow)),
                fireImmediately: true
            },
            {
                // A comparison is with the blueprint as it was when asked for.
                track: () => [shell.documentModel.document, blueprintModel.version],
                run: () => this.closeCompare()
            },
            {
                // A new group is selected as it is made, and the Inspector then edits it.
                track: () => shell.designModel.selection,
                run: sel => {
                    if (sel?.kind === 'preset') this.presetsDialogOpen = false;
                }
            },
            {
                // A reader opens on the blueprint, with the dock closed.
                track: () => shell.documentModel.document?.id,
                run: () => {
                    if (shell.documentModel.document?.access === 'read') {
                        this.dockPanelModel.setCollapsed(true);
                    }
                },
                fireImmediately: true
            }
        );
    }
}

function toValueRow(v: BlueprintVariable) {
    return {
        name: v.name,
        type: v.decl.type,
        setBy: v.writers.length ? v.writers.map(fmtWriter).join(', ') : 'constant',
        value: fmtValue(v.value),
        isSet: v.isSet
    };
}

function fmtWriter(w: BlueprintVariable['writers'][number]): string {
    switch (w.kind) {
        case 'element':
            return w.element;
        case 'output':
            return [w.element, w.output, w.field].filter(Boolean).join('.');
        default:
            return w.kind;
    }
}

function fmtValue(value: unknown): string {
    if (value == null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
}
