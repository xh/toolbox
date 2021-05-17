import {GridModel, localDateCol, boolCheckCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {compactDateRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {PERSIST_APP} from './AppModel';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';
import {Icon} from '@xh/hoist/icon';
import {FormPanelModel} from './FormPanelModel';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @bindable
    @persist
    filterBy = 'all';

    @bindable
    groupAction = ''

    @managed
    formPanelModel = new FormPanelModel(this);

    @managed
    gridModel = new GridModel({
        store: {
            processRawData: this.processRecord
        },
        emptyText: 'Empty todo list...',
        selModel: {mode: 'multiple'},
        enableExport: true,
        rowBorders: true,
        showHover: true,
        sortBy: 'dueDate',
        persistWith: this.persistWith,
        columns: [
            {
                ...actionCol,
                actionsShowOnHoverOnly: true,
                actions: [
                    {
                        icon: Icon.check(),
                        tooltip: 'Mark complete',
                        intent: 'success',
                        actionFn: ({record}) => this.markCompleteAsync(record)
                    },
                    {
                        icon: Icon.delete(),
                        tooltip: 'Remove task',
                        intent: 'danger',
                        actionFn: ({record}) => this.removeTaskAsync(record)
                    }
                ]
            },
            {
                field: 'description',
                flex: 1,
                tooltip: (description) => description
            },
            {
                field: 'complete',
                ...boolCheckCol,
                width: 80
            },
            {
                field: 'dueDate',
                ...localDateCol,
                width: 120,
                renderer: compactDateRenderer('MMM D')
            }
        ]
    });

    get selectedTask() {
        return this.gridModel.selectedRecord?.data;
    }

    get selectedTasksLength() {
        return this.gridModel.selModel.records.length;
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

        this.addReaction({
            track: () => this.groupAction,
            run: (groupAction) => {
                switch (groupAction) {
                    case 'markComplete':
                        return;
                    case 'markActive':
                        return;
                    case 'deleteAll':
                        return this.removeAllAsync();
                    default:
                        return;
                }
            },
            fireImmediately: true
        });
    }

    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        const {gridModel} = this;
        gridModel.loadData(XH.todoService.tasks);
    }

    addTask(task) {
        XH.todoService.addTaskAsync(task);
    }

    editTask(task) {
        XH.todoService.editTaskAsync(task);
    }

    markCompleteAsync(record) {
        const {id, description, dueDate, complete} = record.data;
        this.editTask({
            id,
            description,
            dueDate,
            complete: !complete
        });
        !complete ? XH.toast({message: `You completed '${record.data.description}!'`}) : '';
    }

    async removeTaskAsync(record) {
        const {id, description} = record.data,
            remove = await XH.confirm({
                title: 'Remove Task',
                message: `Are you sure you want to permanently remove '${description}?'`,
                confirmProps: {
                    text: 'Yes',
                    intent: 'primary'
                },
                cancelProps: {
                    text: 'No',
                    intent: 'danger',
                    autoFocus: true
                }
            });

        if (remove) {
            await XH.todoService.removeTaskAsync(id);
            XH.toast({
                message: `Task removed: '${description}'`,
                icon: Icon.cross(),
                intent: 'danger'
            });
        }
    }

    async removeAllAsync() {
        const removeAll = await XH.confirm({
            title: 'Remove All Tasks',
            message: 'Are you sure you want to permanently remove all selected tasks?',
            confirmProps: {
                text: 'Yes',
                intent: 'primary'
            },
            cancelProps: {
                text: 'No',
                intent: 'danger',
                autoFocus: true
            }
        });

        if (removeAll) {
            await XH.prefService.clearAllAsync();
            this.gridModel.clear();
            XH.toast({
                message: 'All selected tasks have been removed.',
                icon: Icon.cross(),
                intent: 'danger'
            });
        }
    }
}
