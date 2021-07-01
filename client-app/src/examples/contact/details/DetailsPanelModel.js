import {XH, HoistModel, managed} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {required} from '@xh/hoist/data/validation/constraints';
import {makeObservable, observable, action} from '@xh/hoist/mobx';

export class DetailsPanelModel extends HoistModel {

    /** @member {Record} */
    @observable.ref currentRecord;

    /** @member {FormModel} */
    @managed formModel;

    /** @member {DirectoryPanelModel} */
    directoryPanelModel;

    get isEditing() {
        return !this.formModel.readonly;
    }

    constructor(directoryPanelModel) {
        super();
        makeObservable(this);
        this.directoryPanelModel = directoryPanelModel;

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
        this.formModel.init(record?.data);
    }

    toggleFavorite() {
        this.directoryPanelModel.toggleFavorite(this.currentRecord);
    }

    async toggleEditAsync() {
        const {formModel, directoryPanelModel, currentRecord} = this,
            {readonly, isDirty} = formModel;

        if (readonly || !isDirty) {
            formModel.setReadonly(!readonly);
            return;
        }

        try {
            await directoryPanelModel.updateContactAsync(currentRecord.id, formModel.getData(true));
            formModel.setReadonly(true);
        } catch (e) {
            XH.handleException(e);
        }
    }

    cancelEdit() {
        const {formModel, currentRecord} = this;
        formModel.setReadonly(true);
        formModel.init(currentRecord.data);
    }
}


