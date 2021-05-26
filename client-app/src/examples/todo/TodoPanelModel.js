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
    showCompleted = false

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
