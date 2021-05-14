import {GridModel, localDateCol, boolCheckCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {compactDateRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {PERSIST_APP} from './AppModel';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';
import {Icon} from '@xh/hoist/icon';
import {TodoFormPanelModel} from './TodoFormPanelModel';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    _localStorageKey = 'todoAppData';

    @bindable
    @persist
    filterBy = 'all';

    @managed
    formPanelModel = new TodoFormPanelModel(this);

    @managed
    gridModel = new GridModel({
        store: {
            processRawData: this.processRecord
        },
        emptyText: 'Empty todo list...',
        enableExport: true,
        rowBorders: true,
        showHover: true,
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

    defaultTasks = [{id: 1, description: 'buy groceries', complete: true, dueDate: '2021-05-21'}, {id: 2, description: 'walk dog', complete: false, dueDate: null}];

    tasks

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
        const {gridModel} = this;
        try {
            if (XH.localStorageService.get(this._localStorageKey)) {
                this.tasks = XH.localStorageService.get(this._localStorageKey);
            } else {
                XH.localStorageService.set(this._localStorageKey, this.defaultTasks);
                this.tasks = this.defaultTasks;
            }

            gridModel.loadData(this.tasks);
        } catch (e) {
            XH.handleException(e);
        }
    }

    addTask(task) {
        XH.localStorageService.set(this._localStorageKey, [...this.tasks, task]);
    }

    async removeTaskAsync(record) {
        const {description} = record.data,
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

        let index = this.tasks.findIndex(task => task.description === description);
        this.tasks.splice(index, 1);

        if (remove) {
            XH.localStorageService.set(this._localStorageKey, this.tasks);
            XH.toast({
                message: `Task removed: '${description}'`,
                icon: Icon.cross(),
                intent: 'danger'
            });
            await this.refreshAsync();
        } else {
            return '';
        }
    }
}
