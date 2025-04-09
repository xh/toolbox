import {XH, HoistModel, managed} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {required} from '@xh/hoist/data/validation/constraints';
import {makeObservable, observable, action} from '@xh/hoist/mobx';
import {StoreRecord} from '@xh/hoist/data';
import {DirectoryPanelModel} from '../DirectoryPanelModel';

export class DetailsPanelModel extends HoistModel {
    @observable.ref
    currentRecord: StoreRecord;

    @managed
    formModel: FormModel;

    directoryPanelModel: DirectoryPanelModel;

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
            formModel.readonly = !readonly;
            return;
        }

        try {
            await directoryPanelModel.updateContactAsync(currentRecord.id, formModel.getData(true));
            formModel.readonly = true;
        } catch (e) {
            XH.handleException(e);
        }
    }

    @action
    cancelEdit() {
        const {formModel, currentRecord} = this;
        formModel.readonly = true;
        formModel.init(currentRecord.data);
    }
}
