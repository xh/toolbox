import type {BlueprintIssue, BlueprintVariable} from '@xh/hoist-chat-kit/blueprint';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, lookup, managed} from '@xh/hoist/core';
import {BlueprintsPanelModel} from './BlueprintsPanelModel';

/** Shows the blueprint's variables, with their writers and current values, and its issues. */
export class InspectorModel extends HoistModel {
    @lookup(BlueprintsPanelModel) panelModel: BlueprintsPanelModel;

    @managed variablesGridModel = new GridModel({
        store: {idSpec: 'name'},
        sortBy: 'name',
        colDefaults: {filterable: true},
        columns: [
            {field: 'name', width: 100},
            {field: 'type', width: 80},
            {field: 'writers', flex: 1, minWidth: 80},
            {field: 'value', flex: 1, minWidth: 90},
            {field: 'isSet', headerName: 'Set', width: 50, align: 'center'}
        ]
    });

    @managed issuesGridModel = new GridModel({
        store: {idSpec: data => `${data.code}${data.path}${data.message}`},
        groupBy: 'severity',
        emptyText: 'No issues',
        columns: [
            {field: 'severity', hidden: true},
            {field: 'code', width: 160, tooltip: true},
            {field: 'path', width: 220, tooltip: true},
            {field: 'message', flex: 1, minWidth: 200, tooltip: true}
        ]
    });

    override onLinked() {
        const {blueprintModel} = this.panelModel;
        this.addReaction(
            {
                track: () => blueprintModel.variables.map(v => [v, v.value, v.isSet]),
                run: () => this.variablesGridModel.loadData(blueprintModel.variables.map(toRow)),
                fireImmediately: true
            },
            {
                track: () => this.panelModel.issues,
                run: issues => this.issuesGridModel.loadData(issues as BlueprintIssue[]),
                fireImmediately: true
            }
        );
    }
}

function toRow(v: BlueprintVariable) {
    return {
        name: v.name,
        type: v.decl.type,
        writers: v.writers.length ? v.writers.map(fmtWriter).join(', ') : 'constant',
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
