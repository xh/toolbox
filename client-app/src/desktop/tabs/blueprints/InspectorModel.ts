import type {
    BlueprintEditResult,
    BlueprintIssue,
    BlueprintOp,
    BlueprintVariable
} from '@xh/hoist-chat-kit/blueprint';
import {elementOutline} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, lookup, managed} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, observable, observableRef} from '@xh/hoist/mobx';
import {capitalize} from 'lodash';
import {applyJsonEdit} from './applyJsonEdit';
import {BlueprintsPanelModel} from './BlueprintsPanelModel';
import {inspectorHistory} from './InspectorHistory';
import {inspectorJson} from './InspectorJson';
import {markdownCol} from './markdown';

/** The open blueprint's variables, validation issues and edit history. */
export class InspectorModel extends HoistModel {
    @lookup(BlueprintsPanelModel) panelModel: BlueprintsPanelModel;

    @managed variablesGridModel = new GridModel({
        store: {idSpec: 'name'},
        sortBy: 'name',
        emptyText: 'No variables. Variables link widgets: one sets a value that others read.',
        rowClassFn: rec => (rec?.data.isSet ? null : 'tb-inspector__default'),
        contextMenu: [
            {
                text: 'Reset to default',
                icon: Icon.reset(),
                recordsRequired: 1,
                displayFn: ({record}) => ({disabled: !record?.data.isSet}),
                actionFn: ({record}) =>
                    this.panelModel.blueprintModel.resetVariable(record.id as string)
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

    @managed issuesGridModel = new GridModel({
        store: {idSpec: data => `${data.code}${data.path}${data.message}`},
        sortBy: 'severity',
        emptyText: 'No issues. Validation errors and warnings show here.',
        columns: [
            {
                field: 'severity',
                headerName: '',
                width: 32,
                align: 'center',
                renderer: v =>
                    v === 'error'
                        ? Icon.error({intent: 'danger'})
                        : Icon.warning({intent: 'warning'})
            },
            {
                field: 'message',
                flex: 1,
                minWidth: 160,
                tooltip: (v, {record}) => `${record.data.code} at ${record.data.path}`
            },
            {field: 'code', hidden: true},
            {field: 'path', hidden: true}
        ]
    });

    @managed historyGridModel = new GridModel({
        store: {idSpec: 'version'},
        sortBy: 'version|desc',
        emptyText: 'No edits yet. Edits by you and the Architect show here, newest first.',
        columns: [
            {field: 'version', headerName: 'Ver', width: 50, align: 'right'},
            {
                field: 'author',
                headerName: '',
                width: 32,
                align: 'center',
                renderer: v =>
                    v === 'architect' ? Icon.ai({title: 'Architect'}) : Icon.user({title: v})
            },
            {
                ...markdownCol({field: 'description', flex: 1, minWidth: 160}),
                tooltip: (v, {record}) => record.data.ops
            },
            {field: 'ops', hidden: true}
        ]
    });

    @managed tabContainerModel = new TabContainerModel({
        tabs: [
            {
                id: 'outline',
                content: () => elementOutline({designModel: this.panelModel.designModel})
            },
            {id: 'variables', content: () => grid({model: this.variablesGridModel})},
            {id: 'issues', content: () => grid({model: this.issuesGridModel})},
            {id: 'history', content: () => inspectorHistory({inspector: this})},
            {id: 'json', title: 'JSON', content: () => inspectorJson({inspector: this})}
        ]
    });

    /** The blueprint as JSON, to edit. Follows the open blueprint until edited. */
    @bindable accessor draft: string = '';

    /** Why the draft is not JSON, if it isn't. */
    @observable accessor parseError: string = null;

    /** The errors that refused the last apply, undo or redo. Shown in the Issues tab until the next. */
    @observableRef accessor applyIssues: BlueprintIssue[] = [];

    /** One line on why the last apply, undo or redo failed, if it did. */
    @computed
    get applyError(): string {
        if (this.parseError) return `Not valid JSON: ${this.parseError}`;
        const n = this.applyIssues.length;
        return n ? `Refused, ${n} error${n > 1 ? 's' : ''} - see Issues` : null;
    }

    @computed
    get currentJson(): string {
        const {blueprint} = this.panelModel.blueprintModel;
        return blueprint ? JSON.stringify(blueprint, null, 2) : '';
    }

    @computed
    get isDirty(): boolean {
        return this.draft !== this.currentJson;
    }

    /** Apply the draft as one edit, "Edit JSON". With errors, nothing changes. */
    @action
    applyDraft() {
        const {parseError, issues} = applyJsonEdit(this.panelModel.blueprintModel, this.draft);
        this.parseError = parseError ?? null;
        this.applyIssues = issues;
    }

    @action
    undo() {
        this.showRefusal(this.panelModel.blueprintModel.undo());
    }

    @action
    redo() {
        this.showRefusal(this.panelModel.blueprintModel.redo());
    }

    @action
    revertDraft() {
        this.draft = this.currentJson;
        this.parseError = null;
        this.applyIssues = [];
    }

    override onLinked() {
        const {blueprintModel} = this.panelModel;
        this.addReaction(
            {
                track: () => this.currentJson,
                run: (json, prev) => {
                    if (this.draft === (prev ?? '')) this.draft = json;
                },
                fireImmediately: true
            },
            {
                track: () => blueprintModel.variables.map(v => [v, v.value, v.isSet]),
                run: () =>
                    this.load(
                        'variables',
                        this.variablesGridModel,
                        blueprintModel.variables.map(toVariableRow)
                    ),
                fireImmediately: true
            },
            {
                track: () => (this.applyIssues.length ? this.applyIssues : this.panelModel.issues),
                run: issues =>
                    this.load('issues', this.issuesGridModel, issues as BlueprintIssue[]),
                fireImmediately: true
            },
            {
                track: () => blueprintModel.history,
                run: history =>
                    this.load(
                        'history',
                        this.historyGridModel,
                        history.map(({version, author, description, ops}) => ({
                            version,
                            author,
                            description: description ?? summarize(ops),
                            ops: JSON.stringify(ops, null, 2)
                        }))
                    ),
                fireImmediately: true
            }
        );
    }

    //------------------
    // Implementation
    //------------------
    private showRefusal({version, issues}: BlueprintEditResult) {
        this.parseError = null;
        this.applyIssues = version == null ? issues.filter(it => it.severity === 'error') : [];
    }

    /** Load a tab's grid, and show its row count in the tab's title. */
    @action
    private load(tabId: string, gridModel: GridModel, rows: object[]) {
        const title = capitalize(tabId);
        gridModel.loadData(rows);
        this.tabContainerModel.findTab(tabId).title = rows.length
            ? `${title} (${rows.length})`
            : title;
    }
}

function toVariableRow(v: BlueprintVariable) {
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

function summarize(ops: BlueprintOp[]): string {
    return ops.map(summarizeOp).join(', ');
}

function summarizeOp(op: BlueprintOp): string {
    if ('path' in op) return `${op.op} ${op.path}`;
    if ('id' in op) return `${op.op} ${op.id}`;
    return op.op;
}
