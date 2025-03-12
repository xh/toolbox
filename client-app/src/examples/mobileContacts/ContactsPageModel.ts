import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {GridModel} from '@xh/hoist/cmp/grid';
import {nameCol, locationCol} from '../../core/columns';
import {uniq} from 'lodash';

import ContactDetailsModel from './details/ContactDetailsModel';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export default class ContactsPageModel extends HoistModel {
    override persistWith = PERSIST_APP;

    @observable.ref tagList: string[] = [];

    @bindable @persist displayMode: 'grid' | 'tiles' = 'tiles';

    @managed gridModel: GridModel;
    @managed contactDetailsModel: ContactDetailsModel;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    get records() {
        return this.gridModel.store.records;
    }

    constructor() {
        super();
        makeObservable(this);

        const gridModel = (this.gridModel = this.createGridModel());
        this.contactDetailsModel = new ContactDetailsModel(this);

        this.addReaction({
            track: () => gridModel.selectedRecord,
            run: rec => this.contactDetailsModel.setCurrentRecord(rec)
        });
    }

    toggleFavorite(record) {
        XH.contactService.toggleFavorite(record.id);
        // Update store directly, to avoid more heavyweight full reload.
        this.gridModel.store.modifyRecords({id: record.id, isFavorite: !record.data.isFavorite});
    }

    clearCurrentSelection() {
        this.gridModel.clearSelection();
    }

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync() {
        const {gridModel} = this;

        try {
            const contacts = await XH.contactService.getContactsAsync();

            runInAction(() => {
                this.tagList = uniq(contacts.flatMap(it => it.tags ?? [])).sort() as string[];
            });

            gridModel.loadData(contacts);
            gridModel.preSelectFirstAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }

    private createGridModel() {
        return new GridModel({
            emptyText: 'No matching contacts found.',
            selModel: 'single',
            store: {
                fields: [
                    {name: 'isFavorite', type: 'bool'},
                    {name: 'profilePicture', type: 'string'}
                ]
            },
            columns: [
                {
                    ...nameCol,
                    width: null,
                    flex: 1
                },
                {
                    ...locationCol,
                    width: 150
                }
            ]
        });
    }
}
