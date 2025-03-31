import {managed, PlainObject, XH} from '@xh/hoist/core';
import {HoistModel} from '@xh/hoist/core/model/HoistModel';
import {FormModel} from '@xh/hoist/cmp/form';
import {makeObservable, observable, action} from '@xh/hoist/mobx';
import {required} from '@xh/hoist/data/validation/constraints';
import {isNil} from 'lodash';

import AppModel from '../AppModel';

export default class DetailsPanelModel extends HoistModel {
    @observable.ref
    currentContact: PlainObject;

    @managed
    formModel: FormModel;

    @managed
    appModel: AppModel;

    get isEditing() {
        return !this.formModel.readonly;
    }

    constructor(appModel: AppModel) {
        super();
        makeObservable(this);

        this.appModel = appModel;

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

    override async doLoadAsync() {
        const id = window.location.pathname.split('/').pop();
        const contact = this.appModel.contacts.find(it => it.id === id);
        this.setCurrentRecord(contact);
    }

    @action
    setCurrentRecord(contact: PlainObject) {
        this.currentContact = contact;
        if (!isNil(contact)) {
            this.formModel.init(contact);
        }
    }

    cancelEdit() {
        this.formModel.readonly = true;
        this.formModel.init(this.currentContact);
    }

    async toggleEditAsync() {
        const {formModel, currentContact} = this;
        const {readonly, isDirty} = formModel;

        if (readonly || !isDirty) {
            formModel.readonly = false;
            return;
        }

        try {
            await this.appModel.updateContactAsync(currentContact.id, formModel.getData(true));
            formModel.readonly = true;
        } catch (e) {
            XH.handleException(e);
        }
    }
}
