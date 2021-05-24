import {GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {fmtDate} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {PERSIST_APP} from './AppModel';
import {TaskDialogModel} from './TaskDialogModel';
import {isEmpty, every} from 'lodash';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {Icon} from '@xh/hoist/icon/Icon';
import {filler, hbox} from '@xh/hoist/cmp/layout';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @bindable
    @persist
    filterBy = 'all';

    @managed
    taskDialogModel = new TaskDialogModel(this);

    @managed
    gridModel = new GridModel({
        emptyText: 'Empty todo list...',
        selModel: {mode: 'multiple'},
        sizingMode: 'large',
        colDefaults: {rowHeight: 60},
        enableExport: true,
        rowBorders: true,
        showHover: true,
        sortBy: 'dueDate',
        groupBy: 'dueDateGroup',
        groupSortFn: (a, b) => {
            if (a==='Today') return -1;
            else if (b==='Today') return 1;
            else if (a==='Upcoming') return -1;
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
                ...actionCol,
                actions: [
                    {
                        title: 'Status',
                        displayFn: ({record}) => {
                            const {complete} = record.data;

                            return {
                                icon: complete ? Icon.checkCircle({size: 'lg'}) : Icon.circle({size: 'lg'}),
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
        makeObservable(this);

        const {gridModel} = this;

        this.addReaction({
            track: () => this.filterBy,
            run: (filterBy) => {
                switch (filterBy) {
                    case 'complete':
                        return gridModel.setFilter({field: 'complete', op: '=', value: true});
                    case 'active':
                        return gridModel.setFilter({field: 'complete', op: '=', value: false});
                    default:
                        return gridModel.setFilter(null);
                }
            },
            fireImmediately: true
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

    async toggleOneCompleteAsync(task, isComplete) {
        const {id, description, dueDate} = task;
        await XH.todoService.editTaskAsync({
            id,
            description,
            dueDate,
            complete: isComplete
        });
        await this.refreshAsync();
        if (isComplete) this.info(`Congrats! You completed '${description}!'`);
        this.nothingInProgressAsync();
    }

    async toggleAllCompleteAsync(isComplete) {
        const {selectedTasks} = this;
        if (isEmpty(selectedTasks)) return;

        for (const task of selectedTasks) {
            const {id, description, dueDate} = task;

            await XH.todoService.editTaskAsync({
                id,
                description,
                dueDate,
                complete: isComplete
            });
        }

        await this.refreshAsync();

        if (isComplete) {
            const count = selectedTasks.length,
                label = count === 1 ? `'${selectedTasks[0].description}!'` : `${count} tasks!`;
            this.info(`Congrats! You completed ${label}`);
        }

        this.nothingInProgressAsync();
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

            this.nothingInProgressAsync();
        }
    }

    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        const tasks = await XH.todoService.getTasksAsync();
        this.gridModel.loadData(tasks);
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

    async nothingInProgressAsync() {
        const tasks = await XH.todoService.getTasksAsync();
        if (every(tasks, {complete: true}) || !tasks.length) {
            XH.showBanner({message: 'You did it! All of it!'});
        }
    }
}
