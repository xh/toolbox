import {CellContext, GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, LoadSpec, managed, persist, SizingMode, XH} from '@xh/hoist/core';
import {RecordAction} from '@xh/hoist/data';
import type {DueDateGroup, Task} from './TaskService';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';
import {span} from '@xh/hoist/cmp/layout';
import {fmtCompactDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon/Icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {every, isEmpty} from 'lodash';
import {createRef, ReactNode} from 'react';
import {PERSIST_APP} from './AppModel';
import {TaskDialogModel} from './TaskDialogModel';

export class TodoPanelModel extends HoistModel {
    override persistWith = PERSIST_APP;

    @managed
    taskDialogModel = new TaskDialogModel(this);

    @bindable
    @persist
    showCompleted = false;

    @bindable
    @persist
    showGroups = true;

    @managed
    gridModel: GridModel<Task>;

    panelRef = createRef<HTMLElement>();

    addAction = new RecordAction({
        icon: Icon.add(),
        text: 'New',
        intent: 'success',
        actionFn: () => this.taskDialogModel.openAddForm()
    });

    editAction = new RecordAction({
        icon: Icon.edit(),
        text: 'Edit',
        intent: 'primary',
        recordsRequired: 1,
        actionFn: () => this.taskDialogModel.openEditForm(this.selectedTasks[0])
    });

    deleteAction = new RecordAction({
        icon: Icon.delete(),
        text: 'Remove',
        intent: 'danger',
        recordsRequired: true,
        actionFn: () => this.deleteTasksAsync(this.selectedTasks)
    });

    toggleCompleteAction = new RecordAction({
        // `RecordAction` callbacks receive the generic `ActionFnData`, whose `record` /
        // `selectedRecords` are non-generic `StoreRecord`s - so unlike `selectedTasks` below
        // (which flows through our `GridModel<Task>`) we assert `as Task` at this boundary.
        // A future generic `RecordAction<T>` could carry the record type through and drop these.
        displayFn: ({selectedRecords}) => {
            const tasks = selectedRecords.map(it => it.data as Task),
                firstTask = tasks[0],
                complete = firstTask?.complete,
                text = complete ? 'Mark all Incomplete' : 'Mark all Complete',
                allSame = tasks.length > 1 && every(tasks, {complete: complete});

            return allSame
                ? {
                      text,
                      icon: complete
                          ? Icon.circle({prefix: 'fal', className: 'xh-text-color-muted'})
                          : Icon.checkCircle({prefix: 'fal', intent: 'success'}),
                      tooltip: text
                  }
                : {hidden: true};
        },
        actionFn: ({selectedRecords}) => {
            const tasks = selectedRecords.map(it => it.data as Task);
            this.toggleCompleteAsync(tasks);
        }
    });

    /** Typed `Task[]` for free: `gridModel` is a `GridModel<Task>`, so its records carry `Task`. */
    get selectedTasks(): Task[] {
        return this.gridModel.selectedRecords.map(it => it.data);
    }

    constructor() {
        super();
        makeObservable(this);

        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => this.showCompleted,
            run: showCompleted => {
                const filter = showCompleted
                    ? null
                    : ({field: 'complete', op: '=', value: false} as const);
                this.gridModel.store.setFilter(filter);
            },
            fireImmediately: true
        });

        this.addReaction({
            track: () => this.showGroups,
            run: showGroups => {
                this.gridModel.setGroupBy(showGroups ? 'dueDateGroup' : null);
                this.gridModel.hideColumn('dueDateGroup');
            },
            fireImmediately: true
        });
    }

    async addTaskAsync(task: Task) {
        await XH.taskService.addAsync(task);
        await this.refreshAsync();
        this.info(`Task added: '${task.description}'`);
    }

    async editTaskAsync(task: Task) {
        await XH.taskService.editAsync([task]);
        await this.refreshAsync();
        this.info(`Task edited: '${task.description}'`);
    }

    async deleteTasksAsync(tasks: Task[]) {
        if (isEmpty(tasks)) return;

        const count = tasks.length,
            {description} = tasks[0],
            message = count === 1 ? `'${description}?'` : `${count} tasks?`,
            confirmed = await XH.confirm({
                title: 'Confirm',
                message: `Are you sure you want to permanently remove ${message}`,
                extraConfirmText: 'REMOVE',
                extraConfirmLabel: `Type 'REMOVE' to remove the task:`
            });

        if (!confirmed) return;

        await XH.taskService.deleteAsync(tasks);
        await this.refreshAsync();

        const label = count === 1 ? `Task removed: '${description}'` : `${count} tasks removed`;
        this.info(label);
    }

    async toggleCompleteAsync(tasks: Task[]) {
        if (isEmpty(tasks)) return;

        const firstTask = tasks[0],
            isCompleting = !firstTask.complete;

        await XH.taskService.toggleCompleteAsync(tasks);
        await this.refreshAsync();

        if (isCompleting) {
            const count = tasks.length;
            if (count > 1) {
                this.info(`Congrats! You completed ${count} tasks!`);
            } else {
                this.info(`Congrats! You completed '${firstTask.description}!'`);
            }
        }
    }

    async resetToDefaultTasksAsync() {
        await XH.taskService.resetToDefaultTasksAsync();
        await this.refreshAsync();
    }

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync(loadSpec: LoadSpec) {
        const tasks = await XH.taskService.getAsync();
        this.gridModel.loadData(tasks);
    }

    private createGridModel() {
        return new GridModel<Task>({
            emptyText: 'Congratulations.  You did it! All of it!',
            selModel: {mode: 'multiple'},
            sizingMode: SizingMode.LARGE,
            enableExport: true,
            hideHeaders: true,
            rowBorders: true,
            showHover: true,
            sortBy: 'dueDate',
            store: {
                fields: [
                    {name: 'complete', type: 'bool'},
                    {name: 'description', type: 'string'},
                    {name: 'dueDate', type: 'localDate'},
                    {name: 'dueDateGroup', type: 'string'}
                ]
            },
            groupSortFn: (a, b) => {
                // `GridGroupSortFn` hands us raw group values as `string` - assert to our union.
                return dueDateGroupSort[a as DueDateGroup] - dueDateGroupSort[b as DueDateGroup];
            },
            onRowDoubleClicked: ({data}) => {
                // ag-Grid's `RowDoubleClickedEvent` is not generic - `data.data` is the untyped row.
                if (data) this.taskDialogModel.openEditForm(data.data as Task);
            },
            contextMenu: [
                this.editAction,
                this.toggleCompleteAction,
                this.deleteAction,
                '-',
                ...GridModel.defaults.contextMenu
            ],
            columns: [
                {
                    ...actionCol,
                    actions: [
                        {
                            displayFn: ({record}) => {
                                const {complete} = record.data as Task;

                                return {
                                    icon: complete
                                        ? Icon.checkCircle({
                                              prefix: 'fal',
                                              intent: 'success',
                                              className: 'large-actions'
                                          })
                                        : Icon.circle({
                                              prefix: 'fal',
                                              className: 'xh-text-color-muted large-actions'
                                          }),
                                    tooltip: complete ? 'Mark Incomplete' : 'Mark Complete'
                                };
                            },
                            actionFn: ({record}) => {
                                this.toggleCompleteAsync([record.data as Task]);
                            }
                        }
                    ]
                },
                {
                    field: 'complete',
                    hidden: true
                },
                {
                    field: 'description',
                    flex: 1,
                    cellClass: 'xh-pad',
                    autoHeight: true
                },
                {
                    field: 'dueDate',
                    ...localDateCol,
                    width: 140,
                    rendererIsComplex: true,
                    renderer: (v, context) => this.dueDateRenderer(v, context)
                },
                {
                    field: 'dueDateGroup',
                    hidden: true
                }
            ]
        });
    }

    private info(message: ReactNode) {
        XH.toast({message, containerRef: this.panelRef.current});
    }

    private dueDateRenderer(v: LocalDate, {record}: CellContext) {
        // `CellContext.record` is a non-generic `StoreRecord` - assert to read typed `Task` fields.
        const overdue = v && v < LocalDate.today() && !(record.data as Task).complete,
            dateStr = fmtCompactDate(v?.date, {
                sameDayFmt: '[Today]',
                nearFmt: 'MMM DD',
                distantFmt: 'MMM DD YYYY'
            });

        return overdue ? span({className: 'xh-intent-warning', item: dateStr}) : dateStr;
    }
}

const dueDateGroupSort: Record<DueDateGroup, number> = {
    Overdue: 1,
    Today: 2,
    Upcoming: 3,
    Complete: 4
};
