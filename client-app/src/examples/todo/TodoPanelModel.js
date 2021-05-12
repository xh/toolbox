import {GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {compactDateRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';
import {PERSIST_APP} from './AppModel';
import {TodoFormPanelModel} from './TodoFormPanelModel';

export class TodoPanelModel extends HoistModel {

    persistWith = PERSIST_APP;

    @bindable
    searchQuery = '';

    @bindable
    @persist
    groupBy = null;

    @bindable
    @persist
    filter = null;

    @managed
    formPanelModel = new TodoFormPanelModel()

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

    constructor() {
        super();
        makeObservable(this);

        const {gridModel} = this;

        this.addReaction({
            track: () => this.searchQuery,
            run: () => this.loadAsync(),
            debounce: ONE_SECOND
        });

        this.addReaction({
            track: () => this.filter,
            run: (selectedFilter) => gridModel.setFilter(selectedFilter)
        });

        const {groupBy} = gridModel;
        this.setGroupBy(groupBy && groupBy.length > 0 ? groupBy[0] : null);
    }


    //------------------------
    // Implementation
    //------------------------
    // async doLoadAsync(loadSpec) {
    //     const {gridModel} = this;
    //
    //     try {
    //     } catch (e) {
    //         XH.handleException(e);
    //     }
    // }

    // processRecord(rawRec) {
    //     return {
    //         ...rawRec,
    //         task: rawRec.task,
    //         complete: rawRec.complete,
    //         dueDate: rawRec.dueDate
    //     };
    // }
}
