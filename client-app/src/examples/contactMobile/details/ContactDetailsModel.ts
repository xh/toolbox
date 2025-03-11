import {HoistModel} from '@xh/hoist/core/model/HoistModel';
import {makeObservable, observable, action} from '@xh/hoist/mobx';
import {StoreRecord} from '@xh/hoist/data';

import ContactsPageModel from '../ContactsPageModel';

export default class ContactDetailsModel extends HoistModel {
    @observable.ref
    currentRecord: StoreRecord;

    contactPageModel: ContactsPageModel;

    constructor(contactPageModel: ContactsPageModel) {
        super();
        makeObservable(this);
        this.contactPageModel = contactPageModel;
    }

    @action
    setCurrentRecord(record) {
        this.currentRecord = record;
        // this.formModel.init(record?.data);
    }
}
