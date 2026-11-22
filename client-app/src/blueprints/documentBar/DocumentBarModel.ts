import type {BlueprintIssue} from '@xh/hoist-chat-kit/blueprint';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, lookup, managed, XH} from '@xh/hoist/core';
import {bindable, compareStructural, observableRef, runInAction} from '@xh/hoist/mobx';
import {BlueprintShellModel} from '../BlueprintShellModel';
import {libraryStatus} from '../libraryColumns';
import {changeSummary} from './changeSummary';
import {documentStatus} from './documentStatus';
import type {DocumentStatus} from './documentStatus';

const SWITCHER_GROUPS = ['Recent', 'All blueprints'];

/** The open blueprint's bar: its status, the quick switcher and the Publish popover. */
export class DocumentBarModel extends HoistModel {
    @lookup(BlueprintShellModel) shell: BlueprintShellModel;

    @bindable accessor switcherOpen = false;
    @bindable accessor publishOpen = false;
    @bindable accessor note = '';

    /** What changed since the last publish, as lines, or null while it loads. */
    @observableRef accessor changes: string[] = null;

    @managed switcherGridModel = new GridModel({
        store: {idSpec: 'id'},
        groupBy: 'group',
        groupSortFn: (a, b) => SWITCHER_GROUPS.indexOf(a) - SWITCHER_GROUPS.indexOf(b),
        hideHeaders: true,
        emptyText: 'No blueprints match.',
        onRowClicked: e => {
            if (e?.data && !e.node.group) this.switchTo(e.data.id);
        },
        columns: [
            {field: 'group', hidden: true},
            {field: 'name', flex: 1},
            {field: 'owner', hidden: true},
            {field: 'recent', hidden: true},
            {
                field: 'status',
                width: 150,
                rendererIsComplex: true,
                renderer: (v, {record}) => libraryStatus(record.data)
            },
            {field: 'draftVersion', hidden: true},
            {field: 'publishedVersion', hidden: true},
            {field: 'readOnly', hidden: true}
        ]
    });

    get status(): DocumentStatus {
        const {documentModel, isSaving, saveIssues, chatModel} = this.shell,
            doc = documentModel.document;
        if (!doc) return null;
        return documentStatus({
            kind: doc.kind,
            version: doc.version,
            access: doc.access,
            isStale: documentModel.isStale,
            isSaving,
            isDirty: documentModel.isDirty,
            saveError: saveIssues.find(it => it.severity === 'error')?.message ?? null,
            architectBusy: chatModel?.isBusy ?? false
        });
    }

    /** The open blueprint's errors and warnings, errors first. */
    get issues(): BlueprintIssue[] {
        const {issues, saveIssues, documentModel} = this.shell,
            // The status pill says a stale draft is not saved, so its refusal is not repeated here.
            all = [...(documentModel.isStale ? [] : saveIssues), ...issues];
        return [
            ...all.filter(it => it.severity === 'error'),
            ...all.filter(it => it.severity !== 'error')
        ];
    }

    get errorCount(): number {
        return this.issues.filter(it => it.severity === 'error').length;
    }

    /** The number the next publish takes. */
    get nextVersion(): number {
        return (this.shell.documentModel.document?.publishedVersion ?? 0) + 1;
    }

    override onLinked() {
        const {shell} = this;
        this.addReaction({
            track: () => ({
                rows: shell.summaries.map(it => {
                    const recent = shell.recentIds.indexOf(it.id);
                    return {
                        id: it.id,
                        group: SWITCHER_GROUPS[recent < 0 ? 1 : 0],
                        recent: recent < 0 ? null : recent,
                        name: it.name,
                        owner: it.owner,
                        draftVersion: it.access === 'write' ? it.draftVersion : null,
                        publishedVersion: it.publishedVersion,
                        readOnly: it.access === 'read'
                    };
                }),
                selectedId: shell.selectedId
            }),
            run: ({rows, selectedId}) => {
                const {switcherGridModel} = this;
                switcherGridModel.loadData(rows);
                switcherGridModel.setSortBy(['recent', 'name']);
                switcherGridModel.selModel.select(selectedId);
            },
            equals: compareStructural,
            fireImmediately: true
        });
    }

    switchTo(id: string) {
        this.switcherOpen = false;
        this.shell.selectAsync(id);
    }

    openLibrary() {
        this.switcherOpen = false;
        this.shell.showLibraryAsync();
    }

    /** Open the Publish popover, and read what changed since the last publish. */
    async openPublishAsync() {
        const {shell} = this,
            {documentModel, blueprintModel, repository} = shell,
            doc = documentModel.document;
        runInAction(() => {
            this.note = '';
            this.changes = null;
            this.publishOpen = true;
        });
        try {
            const last = doc.publishedVersion
                ? await repository.openAsync(doc.id, {as: 'publish'})
                : null;
            runInAction(
                () =>
                    (this.changes = changeSummary(
                        last?.blueprint,
                        blueprintModel.blueprint,
                        documentModel.pendingRenames
                    ))
            );
        } catch (e) {
            XH.handleException(e, {showAlert: false});
            runInAction(() => (this.changes = []));
        }
    }

    async publishAsync() {
        const {note} = this;
        this.publishOpen = false;
        await this.shell.publishAsync(note.trim() || undefined);
    }

    undo() {
        this.showRefusal(this.shell.blueprintModel.undo().issues);
    }

    redo() {
        this.showRefusal(this.shell.blueprintModel.redo().issues);
    }

    private showRefusal(issues: BlueprintIssue[]) {
        const error = issues?.find(it => it.severity === 'error');
        if (error) XH.dangerToast(error.message);
    }
}
