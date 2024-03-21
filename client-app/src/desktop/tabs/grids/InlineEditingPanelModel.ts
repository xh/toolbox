import {GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {dateIs, lengthIs, numberIs, required, Store} from '@xh/hoist/data';
import {
    actionCol,
    booleanEditor,
    calcActionColWidth,
    dateEditor,
    numberEditor,
    selectEditor,
    textAreaEditor,
    textEditor
} from '@xh/hoist/desktop/cmp/grid';
import {fmtDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {isEmpty, isNil, max} from 'lodash';

export class InlineEditingPanelModel extends HoistModel {
    @bindable
    asyncValidation = false;

    @bindable
    fullRowEditing = false;

    @managed
    @observable.ref
    gridModel: GridModel;

    @managed
    store: Store;

    @bindable
    clicksToEdit = 2;

    get clicksToEditNote() {
        const {clicksToEdit} = this;
        if (clicksToEdit === 1) return 'Single-click a row above to edit';
        if (clicksToEdit === 2) return 'Double-click a row above to edit';
        return 'Use top toolbar buttons to edit';
    }

    constructor() {
        super();
        makeObservable(this);
        this.store = this.createStore();
        this.gridModel = this.createGridModel();
        this.add(1);

        this.addReaction({
            track: () => [this.fullRowEditing, this.clicksToEdit],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
            }
        });
    }

    add(count) {
        const firstId = XH.genId(),
            data = [];

        for (let i = 0; i < count; ++i) {
            data.push({
                id: i === 0 ? firstId : XH.genId(),
                name: 'New Record'
            });
        }

        this.withDebug(`Adding ${count} Records`, () => this.store.addRecords(data));
    }

    async beginEditAsync(opts?) {
        await this.gridModel.beginEditAsync(opts);
    }

    async endEditAsync() {
        await this.gridModel.endEditAsync();
    }

    @action
    async commitAllAsync() {
        const isValid = await this.store.validateAsync();
        if (!isValid) {
            const doCommit = await XH.confirm({
                icon: Icon.warning(),
                title: 'Commit?',
                message:
                    'The Store contains invalid records - do you want to commit all changes anyway?',
                confirmProps: {
                    intent: 'success',
                    icon: Icon.check(),
                    text: 'Commit'
                }
            });
            if (!doCommit) return;
        }

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

    revert() {
        this.store.revert();
    }

    @action
    private commitRecord(record) {
        const {store} = this;

        if (record.isAdd) {
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
    private revertRecord(record) {
        this.store.revertRecords(record);
    }

    private createStore() {
        return new Store({
            validationIsComplex: false,
            fields: [
                {
                    name: 'name',
                    type: 'string',
                    rules: [required, lengthIs({max: 15})]
                },
                {
                    name: 'amount',
                    type: 'number',
                    rules: [
                        required,
                        numberIs({min: 0, max: 100}),
                        {
                            when: (f, {category}) => category === 'US',
                            check: async ({value}) => {
                                if (this.asyncValidation) await wait(1000);
                                return isNil(value) || value < 10
                                    ? 'Records where `category` is "US" require `amount` of 10 or greater.'
                                    : null;
                            }
                        }
                    ]
                },
                {
                    name: 'date',
                    type: 'localDate',
                    rules: [dateIs({min: LocalDate.today().startOfYear(), max: 'today'})]
                },
                {
                    name: 'restricted',
                    type: 'bool',
                    defaultValue: false
                },
                {
                    name: 'category',
                    type: 'string',
                    rules: [required]
                },
                {
                    name: 'description',
                    type: 'string',
                    rules: [lengthIs({max: 280})]
                }
            ]
        });
    }

    private createGridModel() {
        const ifNotRestricted = ({record}) => !record.data.restricted;
        return new GridModel({
            selModel: null,
            showCellFocus: true,
            cellBorders: true,
            stripeRows: false,
            fullRowEditing: this.fullRowEditing,
            clicksToEdit: this.clicksToEdit,
            store: this.store,
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
                                    icon: record.isAdd ? Icon.add() : Icon.check(),
                                    disabled: record.isCommitted
                                };
                            },
                            actionFn: ({record}) => this.commitRecord(record)
                        },
                        {
                            icon: Icon.undo(),
                            intent: 'primary',
                            displayFn: ({record}) => ({disabled: !record.isModified}),
                            actionFn: ({record}) => this.revertRecord(record)
                        },
                        {
                            icon: Icon.delete(),
                            intent: 'danger',
                            displayFn: ({record}) => ({
                                icon: record.isAdd ? Icon.close() : Icon.delete()
                            }),
                            actionFn: ({record}) => this.store.removeRecords(record)
                        }
                    ]
                },
                {
                    field: 'restricted',
                    headerName: Icon.lock(),
                    width: 40,
                    align: 'center',
                    resizable: false,
                    editable: true,
                    editor: booleanEditor,
                    renderer: v => (v ? Icon.lock({className: 'xh-warning'}) : '')
                },
                {
                    field: 'name',
                    width: 120,
                    editable: ifNotRestricted,
                    editor: textEditor,
                    tooltip: true
                },
                {
                    field: 'amount',
                    width: 100,
                    editable: ifNotRestricted,
                    editor: numberEditor
                },
                {
                    field: 'category',
                    width: 80,
                    editable: ifNotRestricted,
                    editor: props =>
                        selectEditor({
                            ...props,
                            inputProps: {
                                options: ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac']
                            }
                        })
                },
                {
                    field: 'date',
                    ...localDateCol,
                    editable: ifNotRestricted,
                    editor: props =>
                        dateEditor({
                            ...props,
                            inputProps: {
                                valueType: 'localDate'
                            }
                        }),
                    tooltip: v => fmtDate(v, 'dddd MMMM Do YYYY')
                },
                {
                    field: 'description',
                    width: 300,
                    tooltip: true,
                    editable: ifNotRestricted,
                    editor: textAreaEditor,
                    editorIsPopup: true,
                    omit: this.fullRowEditing
                }
            ]
        });
    }

    private getNextId() {
        const {store} = this,
            {committedRecords} = store;

        if (isEmpty(committedRecords)) return 0;
        return max(committedRecords.map(it => it.id as number)) + 1;
    }
}
