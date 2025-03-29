import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {bindable, makeObservable, observable, action, runInAction} from '@xh/hoist/mobx';
import {GridModel} from '@xh/hoist/cmp/grid';
import {nameCol, locationCol} from '../../../core/columns';
import {uniq} from 'lodash';

// Shared from the desktop version
import {PERSIST_APP} from './AppModel';

import ContactDetailsModel from './details/DetailsPanelModel';

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

    @action
    setDisplayMode(value: 'grid' | 'tiles') {
        this.displayMode = value;

        XH.setPref(PERSIST_APP.prefKey, {
            ...(XH.getPref(PERSIST_APP.prefKey) ?? {}),
            displayMode: value
        });
    }

    async updateContactAsync(id, data) {
        await XH.contactService.updateContactAsync(id, data);
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
            groupBy: 'isFavorite',
            groupRowRenderer: ({value}) => (value === 'true' ? 'Favorites' : 'XH Engineers'),
            groupSortFn: (a, b) => (a < b ? 1 : -1),
            store: {
                fields: [
                    {name: 'isFavorite', type: 'bool'},
                    {name: 'profilePicture', type: 'string'}
                ]
            },
            columns: [
                {
                    field: {name: 'isFavorite', type: 'bool'}
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
