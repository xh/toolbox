import {GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {PERSIST_APP} from './AppModel';
import {TaskDialogModel} from './TaskDialogModel';
import {isEmpty, every} from 'lodash';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {Icon} from '@xh/hoist/icon/Icon';
import {filler, hbox} from '@xh/hoist/cmp/layout';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @managed
    taskDialogModel = new TaskDialogModel(this);

    @managed
    gridModel = new GridModel({
        emptyText: 'Nothing to do?',
        selModel: {mode: 'multiple'},
        sizingMode: 'large',
        colDefaults: {rowHeight: 60},
        enableExport: true,
        rowBorders: true,
        showHover: true,
        sortBy: 'dueDate',
        groupBy: 'dueDateGroup',
        groupSortFn: (a, b) => {
            if (a === 'Overdue') return -1;
            else if (b==='Overdue') return 1;
            else if (a==='Today') return -1;
            else if (b === 'Today') return 1;
            else if (a === 'Complete') return 1;
            else if (b === 'Complete') return -1;
            else return 1;
        },
        persistWith: this.persistWith,
        columns: [
            {
                field: 'description',
                flex: 1,
                tooltip: (description) => description
            },
            {
                field: 'complete',
                hidden: true
            },
            {
                field: 'completeTimestamp',
                hidden: true
            },
            {
                ...actionCol,
                title: 'Status',
                actions: [
                    {
                        displayFn: ({record}) => {
                            const {complete} = record.data;

                            return {
                                icon: complete ? Icon.checkCircle() : Icon.circle(),
                                tooltip: complete ? 'Mark In Progress' : 'Mark complete',
                                intent: complete ? 'success' : ''
                            };
                        },
                        actionFn: ({record}) => {
                            this.toggleOneCompleteAsync(record.data, !record.data.complete);
                        }
                    }
                ]
            },
            {
                field: 'dueDate',
                ...localDateCol,
                width: 140,
                rendererIsComplex: true,
                renderer: null,
                elementRenderer: (v, {record}) => this.dueDateRenderer(v, {record})
            },
            {
                field: 'dueDateGroup',
                hidden: true
            }
        ]
    });

    get selectedTasks() {
        return this.gridModel.selection.map(record => record.data);
    }

    constructor() {
        super();
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

    async toggleOneCompleteAsync(task, isComplete, count = 1) {
        const {description} = task;
        await XH.todoService.editTaskAsync({
            ...task,
            complete: isComplete,
            completeTimestamp: isComplete ? Date.now() : null
        });

        if (count === 1) {
            await this.refreshAsync();
            if (isComplete) this.info(`Congrats! You completed '${description}!'`);
        }
    }

    async toggleAllCompleteAsync(isComplete) {
        const {selectedTasks} = this,
            count = selectedTasks?.length;

        if (isEmpty(selectedTasks)) return;

        for (const task of selectedTasks) {
            await this.toggleOneCompleteAsync(task, isComplete, count);
        }

        await this.refreshAsync();

        if (isComplete) {
            this.info(`Congrats! You completed ${count} tasks!`);
        }
    }

    async removeTasksAsync() {
        const {selectedTasks} =  this;
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
        this.gridModel.loadData(tasks);
        this.validateCompleted(tasks);
    }

    info(message) {
        XH.toast({message});
    }

    dueDateRenderer(v, {record}) {
        const overdue = v && v < LocalDate.today() && !record.data.complete;
        return hbox({
            items: [
                Icon.warning({
                    className: 'xh-orange',
                    title: 'Overdue!',
                    omit: !overdue
                }),
                filler(),
                fmtDate(v, 'MMM D')
            ],
            alignItems: 'center'
        });

    }

    validateCompleted(tasks) {
        if (every(tasks, {complete: true}) || !tasks.length) {
            XH.showBanner({message: 'You did it! All of it!'});
        }
    }
}
