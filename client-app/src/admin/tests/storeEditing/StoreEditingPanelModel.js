import {HoistModel, managed} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {actionCol} from '@xh/hoist/desktop/cmp/grid/columns';
import {Icon} from '@xh/hoist/icon';

@HoistModel
export class StoreEditingPanelModel {
    @managed
    gridModel = new GridModel({
        store: {
            fields: [
                {
                    name: 'name',
                    defaultValue: 'Enter a Name'
                },
                {
                    name: 'description',
                    defaultValue: 'Enter a Description'
                }
            ]
        },
        columns: [
            {
                ...actionCol,
                actions: [
                    {
                        icon: Icon.delete(),
                        intent: 'danger',
                        actionFn: ({record}) => this.store.removeRecords(record)
                    }
                ]
            },
            {
                field: 'name',
                editable: true,
                width: 200
            },
            {
                field: 'description',
                editable: true,
                width: 300
            }
        ]
    });

    @managed
    addedGridModel = new GridModel({
        columns: [
            {
                field: 'id'
            },
            {
                field: 'name',
                width: 200
            },
            {
                field: 'description',
                width: 300
            }
        ]
    });

    @managed
    removedGridModel = new GridModel({
        columns: [
            {
                field: 'id'
            },
            {
                field: 'name',
                width: 200
            },
            {
                field: 'description',
                width: 300
            }
        ]
    });

    get store() {
        return this.gridModel.store;
    }

    constructor() {
        this.addReaction({
            track: () => this.store.records,
            run: () => {
                this.addedGridModel.loadData(this.store.addedRecords);
                this.removedGridModel.loadData(this.store.removedRecords);
            }
        });
    }

    add() {
        this.store.addRecords({name: 'My New Record!'});
    }
}