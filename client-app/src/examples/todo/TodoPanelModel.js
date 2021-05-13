import {GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {compactDateRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {PERSIST_APP} from './AppModel';
import {TodoFormPanelModel} from './TodoFormPanelModel';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @bindable
    @persist
    filterBy = 'all';

    @managed
    formPanelModel = new TodoFormPanelModel(this)

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
                field: 'task',
                width: 300,
                tooltip: (cls) => cls
            },
            {
                field: 'complete',
                width: 100
            },
            {
                field: 'dueDate',
                ...localDateCol,
                width: 100,
                renderer: compactDateRenderer('MMM D')
            }
        ]
    });

    data = [{id: 1, task: 'buy groceries', complete: true, dueDate: '2021-05-21'}, {id: 2, task: 'walk dog', complete: false, dueDate: null}]

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
            gridModel.loadData(this.data);
        } catch (e) {
            XH.handleException(e);
        }
    }
}
