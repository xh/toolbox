import {FormModel} from '@xh/hoist/cmp/form';
import {HoistModel, managed, PlainObject, TaskObserver} from '@xh/hoist/core';
import {lengthIs, required} from '@xh/hoist/data';
import {makeObservable} from '@xh/hoist/mobx';
import {GridViewManagerModel} from '../GridViewManagerModel';

export class SaveDialogModel extends HoistModel {
    parentModel: GridViewManagerModel;

    @managed saveTask = TaskObserver.trackLast();

    @managed formModel = new FormModel({
        fields: [
            {
                name: 'name',
                rules: [
                    required,
                    lengthIs({max: 255}),
                    ({value}) => {
                        if (this.parentModel?.views.find(it => it.data.name === value)) {
                            return `An entry with name "${value}" already exists`;
                        }
                    }
                ]
            },
            {name: 'description'}
        ]
    });

    viewStub: ViewStub;

    get isAdd(): boolean {
        return !!this.viewStub?.isAdd;
    }

    constructor(parentModel: GridViewManagerModel, viewStub: ViewStub) {
        super();
        makeObservable(this);

        this.parentModel = parentModel;
        this.viewStub = viewStub;
        this.formModel.init({
            name: this.isAdd ? `` : `${viewStub.name} (COPY)`,
            description: this.isAdd ? `` : viewStub.description
        });
    }

    close() {
        this.parentModel.closeSaveDialog();
    }

    async saveAsAsync() {
        return this.doSaveAsAsync().linkTo(this.saveTask).catchDefault();
    }

    //------------------------
    // Implementation
    //------------------------
    async doSaveAsAsync() {
        const {formModel, parentModel, viewStub} = this,
            {name, description} = formModel.getData(),
            isValid = await formModel.validateAsync();

        if (!isValid) return;

        const newObj = await parentModel.restStore
            .addRecordAsync({data: {name, description, value: viewStub.value}})
            .catchDefault();

        await parentModel.refreshAsync();
        await parentModel.selectAsync(newObj.id);
        this.close();
    }
}

export interface ViewStub {
    name: string;
    description: string;
    value: PlainObject;
    isAdd: boolean;
}
