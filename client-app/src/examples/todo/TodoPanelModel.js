import {GridModel, localDateCol, boolCheckCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {compactDateRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {PERSIST_APP} from './AppModel';
import {FormPanelModel} from './FormPanelModel';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @bindable
    @persist
    filterBy = 'all';

    @bindable
    dialogIsOpen = false;

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
    }

    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        const tasks = await XH.todoService.getTasksAsync();
        this.gridModel.loadData(tasks);
    }

    async addTaskAsync(task) {
        await XH.todoService.addTaskAsync(task);
        await this.refreshAsync();
        XH.toast({message: `Task Added: '${task.description}'`});
    }

    async editTaskAsync(task) {
        await XH.todoService.editTaskAsync(task);
        await this.refreshAsync();
        this.info(`Task edited: '${task.description}'`);
    }

    async toggleCompleteAsync(record) {
        const {id, description, dueDate, complete} = record.data;
        await XH.todoService.editTaskAsync({
            id,
            description,
            dueDate,
            complete: !complete
        });
        await this.refreshAsync();

        if (!complete) {
            this.info(`Congrats! You completed '${record.data.description}!'`);
        } else {
            this.info(`Too bad! Back to work on '${record.data.description}!'`);
        }
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

        if (remove) {
            await XH.todoService.removeTaskAsync(record.data);
            await this.refreshAsync();
            this.info(`Task removed: '${description}'`);
        }
    }


    info(message) {
        XH.toast({message});
    }

}
