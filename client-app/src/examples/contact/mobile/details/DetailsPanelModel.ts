import {XH, managed} from '@xh/hoist/core';
import {HoistModel} from '@xh/hoist/core/model/HoistModel';
import {FormModel} from '@xh/hoist/cmp/form';
import {makeObservable, observable, action} from '@xh/hoist/mobx';
import {StoreRecord} from '@xh/hoist/data';
import {required} from '@xh/hoist/data/validation/constraints';
import {isNil} from 'lodash';

import DirectoryPanelModel from '../DirectoryPanelModel';

export default class DetailsPanelModel extends HoistModel {
    @observable.ref
    currentRecord: StoreRecord;

    directoryPanelModel: DirectoryPanelModel;

    @managed
    formModel: FormModel;

    get isEditing() {
        return !this.formModel.readonly;
    }

    constructor(directoryPanelModel: DirectoryPanelModel) {
        super();
        makeObservable(this);

        const {id} = this.componentProps;

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
        if (!isNil(record)) {
            this.formModel.init(record?.data);
            XH.appendRoute('details', {id: record.id});
        }
    }

    @action
    clearCurrentRecord() {
        // Allow animation to complete before clearing record
        setTimeout(() => {
            this.setCurrentRecord(null);
            this.directoryPanelModel.clearCurrentSelection();
        }, 250);
    }

    cancelEdit() {
        this.formModel.readonly = true;
        this.formModel.init(this.currentRecord.data);
    }

    async toggleEditAsync() {
        const {formModel, directoryPanelModel, currentRecord} = this;
        const {readonly, isDirty} = formModel;

        // Pulled from standard details page
        // How could the form be "dirty" if it's readonly?
        if (readonly || !isDirty) {
            formModel.readonly = false;
            return;
        }

        try {
            await directoryPanelModel.updateContactAsync(currentRecord.id, formModel.getData(true));
            formModel.readonly = true;
        } catch (e) {
            XH.handleException(e);
        }
    }
}
