import {HoistModel, managed, persist, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {GridModel} from '@xh/hoist/cmp/grid';
import {nameCol, locationCol} from '../../core/columns';
import {ContactService} from '../../examples/contact/svc/ContactService';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export default class ContactsPageModel extends HoistModel {
    override persistWith = PERSIST_APP;

    @bindable @persist displayMode: 'grid' | 'tiles' = 'tiles';

    @managed gridModel: GridModel;

    get records() {
        return this.gridModel.store.records;
    }

    constructor() {
        super();
        makeObservable(this);

        // eslint-disable-next-line
        const gridModel = (this.gridModel = this.createGridModel());
    }

    toggleFavorite(record) {
        XH.contactService.toggleFavorite(record.id);
        // Update store directly, to avoid more heavyweight full reload.
        this.gridModel.store.modifyRecords({id: record.id, isFavorite: !record.data.isFavorite});
    }

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync() {
        const {gridModel} = this;

        try {
            await XH.installServicesAsync(ContactService);
            const contacts = await XH.contactService.getContactsAsync();
            // runInAction(() => {
            //     this.tagList = uniq(contacts.flatMap(it => it.tags ?? [])).sort() as string[];
            //     this.locationList = uniq(contacts.map(it => it.location)).sort() as string[];
            // });

            gridModel.loadData(contacts);
            gridModel.preSelectFirstAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }

    private createGridModel() {
        return new GridModel({
            emptyText: 'No matching contacts found.',
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
