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

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @managed
    taskDialogModel = new TaskDialogModel(this);

    @bindable
    showCompleted = false

    @managed
    gridModel = new GridModel({
        emptyText: 'Nothing to do?',
        selModel: {mode: 'multiple'},
        sizingMode: 'large',
        colDefaults: {rowHeight: 60},
        enableExport: true,
        rowBorders: true,
        showHover: true,
        hideHeaders: true,
        sortBy: 'dueDate',
        groupBy: 'dueDateGroup',
        groupSortFn: (a, b) => {
            a = dueDateGroupSort[a];
            b = dueDateGroupSort[b];
            return a-b;
        },
        persistWith: this.persistWith,
        columns: [
            {
                ...actionCol,
                actions: [
                    {
                        displayFn: ({record}) => {
                            const {complete} = record.data;

                            return {
                                icon: complete ?
                                    Icon.checkCircle({prefix: 'fal', className: 'xh-intent-success'}) :
                                    Icon.circle({prefix: 'fal', className: 'xh-text-color-muted'}),
                                tooltip: complete ? 'Mark In Progress' : 'Mark complete'
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
                tooltip: (description) => description
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

    get selectedTasks() {
        return this.gridModel.selection.map(record => record.data);
    }

    constructor() {
        super();
        makeObservable(this);

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
        const overdue = v && v < LocalDate.today() && !record.data.complete,
            dateStr = fmtDate(v, 'MMM D');
        if (!overdue) {
            return dateStr;
        } else {
            return Icon.warning({
                className: 'xh-orange',
                title: 'Overdue!',
                asHtml: true
            }) + ' ' + dateStr;
        }
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
