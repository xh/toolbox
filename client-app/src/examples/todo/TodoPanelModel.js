import {GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {PERSIST_APP} from './AppModel';
import {TaskDialogModel} from './TaskDialogModel';
import {isEmpty, every} from 'lodash';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {Icon} from '@xh/hoist/icon/Icon';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {RecordAction} from '@xh/hoist/data';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @managed
    taskDialogModel = new TaskDialogModel(this);

    @bindable
    showCompletedOnly = false

    /** @member {GridModel} */
    @managed
    gridModel;

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
        actionFn: () => this.taskDialogModel.openEditForm()
    })

    deleteAction = new RecordAction({
        icon: Icon.delete(),
        text: 'Remove',
        intent: 'danger',
        recordsRequired: true,
        actionFn: () => this.removeSelectedTasksAsync()
    });

    toggleCompleteAction = new RecordAction({
        displayFn: ({selectedRecords}) => {
            const tasks = selectedRecords.map(it => it.data),
                firstTask = tasks[0],
                complete = firstTask?.complete,
                text = complete ? 'Mark all Incomplete' : 'Mark all Complete',
                allSame = tasks.length > 1 && every(tasks, {complete: complete});

            return allSame ?
                {
                    text,
                    icon: complete ?
                        Icon.circle({prefix: 'fal', className: 'xh-text-color-muted'}) :
                        Icon.checkCircle({prefix: 'fal', className: 'xh-intent-success'}),
                    tooltip: text
                } :
                {hidden: true};
        },
        actionFn: ({selectedRecords}) => {
            const tasks = selectedRecords.map(it => it.data),
                firstTask = tasks[0];

            this.toggleCompleteAsync(tasks, !firstTask.complete);
        }
    });

    get selectedTasks() {
        return this.gridModel.selection.map(it => it.data);
    }

    constructor() {
        super();
        makeObservable(this);

        this.gridModel = new GridModel({
            emptyText: 'No tasks to show...',
            selModel: {mode: 'multiple'},
            sizingMode: 'large',
            enableExport: true,
            hideHeaders: true,
            rowBorders: true,
            showHover: true,
            sortBy: 'dueDate',
            groupBy: 'dueDateGroup',
            groupSortFn: (a, b) => {
                a = dueDateGroupSort[a];
                b = dueDateGroupSort[b];
                return a - b;
            },
            persistWith: this.persistWith,
            contextMenu: [
                this.editAction,
                this.toggleCompleteAction,
                this.deleteAction,
                '-',
                ...GridModel.defaultContextMenu
            ],
            columns: [
                {
                    ...actionCol,
                    actions: [
                        {
                            displayFn: ({record}) => {
                                const {complete} = record.data;

                                return {
                                    icon: complete ?
                                        Icon.checkCircle({prefix: 'fal', className: 'xh-intent-success large-actions'}) :
                                        Icon.circle({prefix: 'fal', className: 'xh-text-color-muted large-actions'}),
                                    tooltip: complete ? 'Mark Incomplete' : 'Mark Complete'
                                };
                            },
                            actionFn: ({record}) => {
                                this.toggleCompleteAsync(record.data, !record.data.complete);
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
                    tooltip: (description) => description,
                    autoHeight: true
                },
                {
                    field: 'dueDate',
                    ...localDateCol,
                    width: 140,
                    rendererIsComplex: true,
                    renderer: (v, {record}) => this.dueDateRenderer(v, {record})
                },
                {
                    field: 'dueDateGroup',
                    hidden: true
                }
            ]
        });

        this.addReaction({
            track: () => this.showCompletedOnly,
            run: () => this.gridModel.setFilter(this.createFilter())
        });
    }

    async addTaskAsync(task) {
        await XH.todoService.addTaskAsync(task);
        await this.refreshAsync();
        this.info(`Task added: '${task.description}'`);
    }

    async editTaskAsync(task) {
        await XH.todoService.editTaskAsync(task);
        await this.refreshAsync();
        this.info(`Task edited: '${task.description}'`);
    }

    async toggleCompleteAsync(tasks, isComplete) {
        const count = tasks.length,
            {description} = tasks;

        if (isEmpty(tasks)) return;

        await XH.todoService.toggleCompleteAsync(tasks, isComplete);
        await this.refreshAsync();

        if (isComplete) {
            if (count) {
                this.info(`Congrats! You completed ${count} tasks!`);
            } else {
                this.info(`Congrats! You completed '${description}!'`);
            }
        }
    }

    async removeSelectedTasksAsync() {
        const {selectedTasks} = this;
        if (isEmpty(selectedTasks)) return;

        const count = selectedTasks.length,
            {description} = selectedTasks[0],
            message = count === 1 ? `'${description}?'` : `${count} tasks?`,
            remove = await XH.confirm({
                title: 'Confirm',
                message: `Are you sure you want to permanently remove ${message}`
            });

        if (remove) {
            const label = count === 1 ? `Task removed: '${description}'` : `${count} tasks removed`;

            for (const task of selectedTasks) {
                await XH.todoService.removeTasksAsync(task);
            }

            await this.refreshAsync();
            this.info(label);
        }
    }

    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        const tasks = await XH.todoService.getTasksAsync();

        //  Clear store so description field's auto height readjusts after edit
        this.gridModel.clear();
        this.gridModel.loadData(tasks);

        this.validateCompleted(tasks);
    }

    createFilter() {
        const {showCompletedOnly} = this;

        return showCompletedOnly ? {field: 'complete', op: '=', value: true} : null;
    }

    info(message) {
        XH.toast({message});
    }

    dueDateRenderer(v, {record}) {
        const overdue = v && v < LocalDate.today() && !record.data.complete,
            dateStr = fmtDate(v, 'MMM D');

        return overdue ? `<span class="xh-intent-warning">${dateStr}</span>` : dateStr;
    }

    validateCompleted(tasks) {
        if (every(tasks, {complete: true}) || !tasks.length) {
            XH.showBanner({message: 'You did it! All of it!'});
        }
    }
}

const dueDateGroupSort = {
    'Overdue': 1,
    'Today': 2,
    'Upcoming': 3,
    'Complete': 4
};
