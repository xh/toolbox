import {HoistModel} from '@xh/hoist/core/model/HoistModel';
import {FormModel} from '@xh/hoist/cmp/form';
import {managed} from '@xh/hoist/core';
import {bindable, makeObservable, observable, action} from '@xh/hoist/mobx';
import {StoreRecord} from '@xh/hoist/data';
import {required} from '@xh/hoist/data/validation/constraints';
import {isNil} from 'lodash';

import ContactsPageModel from '../ContactsPageModel';

export default class ContactDetailsModel extends HoistModel {
    @observable.ref
    currentRecord: StoreRecord;

    @bindable visible: boolean = false;

    contactPageModel: ContactsPageModel;

    @managed
    formModel: FormModel;

    constructor(contactPageModel: ContactsPageModel) {
        super();
        makeObservable(this);
        this.contactPageModel = contactPageModel;

        this.formModel = new FormModel({
            readonly: true,
            fields: [
                {name: 'name', rules: [required]},
                {name: 'email', rules: [required]},
                {name: 'location', rules: [required]},
                {name: 'workPhone'},
                {name: 'cellPhone'},
                {name: 'bio'},
                {name: 'tags'}
            ]
        });
    }

    @action
    setCurrentRecord(record) {
        this.currentRecord = record;
        if (!isNil(record)) {
            this.formModel.init(record?.data);
            this.visible = true;
        }
    }

    @action
    clearCurrentRecord() {
        this.visible = false;
        // Allow animation to complete before clearing record
        setTimeout(() => {
            this.setCurrentRecord(null);
            this.contactPageModel.clearCurrentSelection();
        }, 250);
    }
}
