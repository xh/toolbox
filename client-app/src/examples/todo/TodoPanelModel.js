import {GridModel, localDateCol, boolCheckCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {compactDateRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {PERSIST_APP} from './AppModel';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';
import {Icon} from '@xh/hoist/icon';
import {reject} from 'lodash';
import {FormPanelModel} from './FormPanelModel';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    _localStorageKey = 'todoAppData';

    @bindable
    @persist
    filterBy = 'all';

    @managed
    formPanelModel = new FormPanelModel(this);

    @managed
    gridModel = new GridModel({
        store: {
            processRawData: this.processRecord
        },
        emptyText: 'Empty todo list...',
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
                        icon: Icon.delete(),
                        tooltip: 'Remove task',
                        intent: 'danger',
                        actionFn: ({record}) => this.removeTaskAsync(record)
                    },
                    {
                        icon: Icon.edit(),
                        tooltip: 'Edit task'
                    }
                ]
            },
            {
                field: 'description',
                flex: 1,
                tooltip: (cls) => cls
            },
            {
                field: 'complete',
                ...boolCheckCol,
                width: 80
            },
            {
                field: 'dueDate',
                ...localDateCol,
                width: 100,
                renderer: compactDateRenderer('MMM D')
            }
        ]
    });

    get selectedTask() {
        return this.gridModel.selectedRecord?.data;
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

    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        const {gridModel} = this,
            tasks = XH.getPref('todoApp');
        gridModel.loadData(tasks);
    }

    addTask(task) {
        const tasks = XH.getPref('todoApp');
        XH.setPref('todoApp', [...tasks, task]);
    }

    editTask(task) {
        const {id} = task;
        let tasks = XH.getPref('todoApp');
        tasks = reject(tasks, {id});
        tasks = [...tasks, task];
        XH.setPref('todoApp', tasks);
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
            let tasks = XH.getPref('todoApp');
            tasks = reject(tasks, {id});
            XH.setPref('todoApp', tasks);

            XH.toast({
                message: `Task removed: '${description}'`,
                icon: Icon.cross(),
                intent: 'danger'
            });
            await this.refreshAsync();
        }
    }
}
