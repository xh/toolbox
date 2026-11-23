import type {Blueprint, BlueprintIssue} from '@xh/hoist-chat-kit/blueprint';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, lookup, managed, XH} from '@xh/hoist/core';
import {bindable, compareStructural, computed, observableRef, runInAction} from '@xh/hoist/mobx';
import {BlueprintShellModel} from '../BlueprintShellModel';
import {EditorModel} from '../editor/EditorModel';
import {libraryStatus} from '../libraryColumns';
import {changeCount, changeSummary} from './changeSummary';
import {documentStatus} from './documentStatus';
import type {DocumentStatus} from './documentStatus';
import {publishState} from './publishState';
import type {PublishState} from './publishState';

const SWITCHER_GROUPS = ['Recent', 'All blueprints'];

/** The open blueprint's bar: its status, the quick switcher and the Publish popover. */
export class DocumentBarModel extends HoistModel {
    @lookup(BlueprintShellModel) shell: BlueprintShellModel;

    @bindable accessor switcherOpen = false;
    @bindable accessor publishOpen = false;
    @bindable accessor note = '';

    @lookup(EditorModel) editorModel: EditorModel;

    /** The live publish's blueprint, which the draft's changes count against, or null. */
    @observableRef accessor liveBlueprint: Blueprint = null;

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

    /** What changed since the live publish, as lines, or null before a publish or while it loads. */
    @computed
    get changes(): string[] {
        const {documentModel, blueprintModel} = this.shell,
            doc = documentModel.document;
        if (!doc?.publishedVersion) return doc ? [] : null;
        if (!this.liveBlueprint) return null;
        return changeSummary(
            this.liveBlueprint,
            blueprintModel.blueprint,
            documentModel.pendingRenames
        );
    }

    /** How many changes the draft holds since the live publish, as the popover counts them. */
    @computed
    get changeCount(): number {
        const {documentModel, blueprintModel} = this.shell;
        if (!documentModel.document?.publishedVersion || !this.liveBlueprint) return 0;
        return changeCount(
            this.liveBlueprint,
            blueprintModel.blueprint,
            documentModel.pendingRenames
        );
    }

    /** Open History in the dock. */
    openHistory() {
        this.editorModel?.showTab('history');
    }

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

    /** What the publish control and its popover show. */
    get publishState(): PublishState {
        return publishState(this.issues, this.shell.documentModel.unfinishedElements);
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
            track: () => {
                const doc = shell.documentModel.document;
                return [doc?.id, doc?.kind, doc?.publishedVersion];
            },
            run: () => this.loadLiveAsync(),
            fireImmediately: true
        });
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

    /** Open the Publish popover, with what changed since the last publish. */
    openPublish() {
        this.note = '';
        this.publishOpen = true;
    }

    // Read the live publish, which the draft's changes count against.
    private async loadLiveAsync() {
        const {documentModel, repository} = this.shell,
            doc = documentModel.document;
        runInAction(() => (this.liveBlueprint = null));
        if (doc?.kind !== 'draft' || !doc.publishedVersion) return;
        try {
            const live = await repository.openAsync(doc.id, {as: 'publish'});
            runInAction(() => (this.liveBlueprint = live?.blueprint ?? null));
        } catch (e) {
            XH.handleException(e, {showAlert: false});
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
