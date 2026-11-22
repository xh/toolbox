import type {BlueprintIssue, BlueprintVariable} from '@xh/hoist-chat-kit/blueprint';
import {
    elementInspector,
    presetsEditor,
    sourcesEditor,
    variablesEditor
} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {badge} from '@xh/hoist/cmp/badge';
import {GridModel} from '@xh/hoist/cmp/grid';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, lookup, managed, persist} from '@xh/hoist/core';
import type {PersistOptions} from '@xh/hoist/core';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {fmtCompactDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, observable, observableRef, runInAction} from '@xh/hoist/mobx';
import {applyJsonEdit} from '../applyJsonEdit';
import {BlueprintShellModel} from '../BlueprintShellModel';
import {markdownCol} from '../markdown';
import {compareRows} from './compareRows';
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

const INSPECTOR_TABS = {
    element: 'config',
    variable: 'variables',
    source: 'sources',
    preset: 'presets'
};

/**
 * The open blueprint's editor: the left dock and its tabs, the Inspector's tabs, the History
 * timeline, and the JSON view's draft.
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

    /** The publish the JSON view compares the blueprint open with, or null. */
    @observable accessor compareVersion: number = null;

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

    @managed inspectorTabsModel = new TabContainerModel({
        tabs: [
            {
                id: 'config',
                title: 'Config',
                content: () =>
                    elementInspector({
                        designModel: this.shell.designModel,
                        onShowPresetGroup: () => this.inspectorTabsModel.activateTab('presets')
                    })
            },
            {
                id: 'variables',
                content: () => variablesEditor({designModel: this.shell.designModel})
            },
            {id: 'sources', content: () => sourcesEditor({designModel: this.shell.designModel})},
            {id: 'presets', content: () => presetsEditor({designModel: this.shell.designModel})}
        ]
    });

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
                        item: v
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
        hideHeaders: true,
        emptyText: 'No edits yet. Edits by you and the Architect show here, newest first.',
        rowClassFn: rec =>
            rec?.data.undone
                ? 'tb-history__undone'
                : rec?.data.kind === 'publish'
                  ? 'tb-history__publish'
                  : null,
        columns: [
            {field: 'kind', hidden: true},
            {field: 'version', hidden: true},
            {field: 'undone', hidden: true},
            {field: 'note', hidden: true},
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
                ...markdownCol({field: 'description', flex: 1, minWidth: 140}),
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
                width: 80,
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
                    }
                ]
            }
        ]
    });

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

    /** Show in the JSON view how a publish differs from the blueprint open. */
    async compareAsync(version: number) {
        const {shell} = this,
            record = await shell.repository
                .openAsync(shell.documentModel.document.id, {as: 'publish', version})
                .catchDefault();
        if (!record) return;
        this.compareGridModel.loadData(
            compareRows(record.blueprint, shell.blueprintModel.blueprint)
        );
        runInAction(() => {
            this.compareVersion = version;
            shell.editorView = 'json';
        });
    }

    @action
    closeCompare() {
        this.compareVersion = null;
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

    override onLinked() {
        const {shell} = this,
            {blueprintModel} = shell;
        this.addReaction(
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
                // Until one inspector edits every kind, show the tab for what is selected.
                track: () => shell.designModel.selection?.kind,
                run: kind => {
                    const tab = INSPECTOR_TABS[kind];
                    if (tab) this.inspectorTabsModel.activateTab(tab);
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
