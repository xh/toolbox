import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid';
import {Icon} from '@xh/hoist/icon';
import {action} from '@xh/hoist/mobx';
import {isEmpty, max} from 'lodash';

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
                width: calcActionColWidth(3),
                actions: [
                    {
                        icon: Icon.check(),
                        intent: 'success',
                        displayFn: ({record}) => {
                            return {
                                icon: record.isNew ? Icon.add() : Icon.check(),
                                disabled: record.isCommitted
                            };
                        },
                        actionFn: ({record}) => this.commitRecord(record)
                    },
                    {
                        icon: Icon.undo(),
                        intent: 'primary',
                        displayFn: ({record}) => ({disabled: record.isCommitted}),
                        actionFn: ({record}) => this.revertRecord(record)
                    },
                    {
                        icon: Icon.delete(),
                        intent: 'danger',
                        displayFn: ({record}) => ({icon: record.isNew ? Icon.close() : Icon.delete()}),
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

    get store() {
        return this.gridModel.store;
    }

    constructor() {
        this.store.loadData([
            {
                id: 0,
                name: 'Record 0',
                description: 'This is a record'
            },
            {
                id: 1,
                name: 'Record 1',
                description: 'This is a record'
            },
            {
                id: 2,
                name: 'Record 2',
                description: 'This is a record'
            }
        ]);
    }

    add() {
        this.store.addRecords({id: XH.genId()});
    }

    addFive() {
        this.store.addRecords([
            {id: XH.genId(), name: 'New Record 1'},
            {id: XH.genId(), name: 'New Record 2'},
            {id: XH.genId(), name: 'New Record 3'},
            {id: XH.genId(), name: 'New Record 4'},
            {id: XH.genId(), name: 'New Record 5'}
        ]);
    }

    @action
    commitAll() {
        const {store} = this,
            {addedRecords, modifiedRecords, removedRecords} = store,
            nextId = this.getNextId(),
            transaction = {
                add: addedRecords.map((it, idx) => ({id: nextId + idx, ...it.data})),
                update: modifiedRecords.map(it => ({id: it.id, ...it.data})),
                remove: removedRecords.map(it => it.id)
            };

        store.removeRecords(addedRecords);
        store.updateData(transaction);
    }

    async revert() {
        const doRevert = await XH.confirm({
            icon: Icon.warning(),
            title: 'Revert?',
            message: 'Are you sure you want to revert all changes?',
            confirmProps: {
                intent: 'warning',
                icon: Icon.undo(),
                text: 'Revert'
            }
        });

        if (doRevert) this.store.revert();
    }

    @action
    commitRecord(record) {
        const {store} = this;

        if (record.isNew) {
            // If it is a new record then we need to:

            // 1. Remove the temporary un-committed record from the store
            store.removeRecords(record);

            // 2. Construct new record raw data, with a valid assigned id
            store.updateData({add: [{...record.data, id: this.getNextId()}]});
        } else {
            store.updateData({update: [record.data]});
        }
    }

    @action
    revertRecord(record) {
        this.store.revertRecords(record);
    }

    getNextId() {
        const {store} = this,
            {committedRecords} = store;

        if (isEmpty(committedRecords)) return 0;
        return max(committedRecords.map(it => it.id)) + 1;
    }

}
