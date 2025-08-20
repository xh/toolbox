import {managed, XH} from '@xh/hoist/core';
import {HoistModel} from '@xh/hoist/core/model/HoistModel';
import {FormModel} from '@xh/hoist/cmp/form';
import {makeObservable} from '@xh/hoist/mobx';
import {required} from '@xh/hoist/data/validation/constraints';
import {isNil} from 'lodash';

import AppModel from '../AppModel';

export default class DetailsPanelModel extends HoistModel {
    @managed
    formModel: FormModel;

    @managed
    appModel: AppModel;

    get isEditing() {
        return !this.formModel.readonly;
    }

    get currentContact() {
        if (XH.routerState?.name !== 'default.details') return null;
        return this.appModel.contacts.find(it => it.id === XH.routerState.params.id);
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

        this.addReaction({
            track: () => this.currentContact,
            run: contact => {
                if (!isNil(contact)) {
                    this.formModel.init(contact);
                }
            },
            fireImmediately: true
        });
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
