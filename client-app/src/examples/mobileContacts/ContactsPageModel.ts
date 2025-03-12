import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {GridModel} from '@xh/hoist/cmp/grid';
import {Icon} from '@xh/hoist/icon';
import {nameCol, locationCol} from '../../core/columns';
import {uniq} from 'lodash';

import ContactDetailsModel from './details/ContactDetailsModel';
import './ContactPage.scss';

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
        this.gridModel.store.modifyRecords({id: record.id, isFavorite: !record.data.isFavorite});
    }

    clearCurrentSelection() {
        this.gridModel.clearSelection();
    }

    async updateContactAsync(id, data) {
        await XH.contactService.updateContactAsync(id, data);
        // Is this rebuiling the whole UI? Or just refreshing the grid / tile data?
        // @TODO Can "modifyRecords" be used as above for a more targeted update?
        await this.loadAsync();
    }

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync() {
        const {gridModel} = this;

        try {
            const contacts = await XH.contactService.getContactsAsync();

            runInAction(() => {
                // This seems like an odd descision - tag selector is just an aggregate of what
                // tags happen to be currently present in the persisted data?
                this.tagList = uniq(contacts.flatMap(it => it.tags ?? [])).sort() as string[];
            });

            gridModel.loadData(contacts);
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
                    field: {name: 'isFavorite', type: 'bool'},
                    headerName: '',
                    headerClass: 'tb-mobile-favorite-cell',
                    cellClass: 'tb-mobile-favorite-cell',
                    width: 30,
                    renderer: value =>
                        Icon.favorite({
                            color: value ? 'gold' : null,
                            prefix: value ? 'fas' : 'far'
                        })
                },
                {
                    ...nameCol,
                    width: null,
                    flex: 1
                },
                {
                    ...locationCol,
                    width: 150
                },
                {field: {name: 'email', type: 'string'}, hidden: true},
                {field: {name: 'bio', type: 'string'}, hidden: true},
                {field: {name: 'tags', type: 'tags'}, hidden: true},
                {field: {name: 'workPhone', type: 'string'}, hidden: true},
                {field: {name: 'cellPhone', type: 'string'}, hidden: true}
            ]
        });
    }
}
