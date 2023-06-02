import {HoistModel, managed} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {observable, action, makeObservable} from '@xh/hoist/mobx';
import {WeatherPanelModel} from './WeatherPanelModel';

export class LocationDialogModel extends HoistModel {
    parentModel: WeatherPanelModel;

    @observable
    isOpen = false;

    @managed
    formModel = new FormModel({
        fields: [
            {
                name: "locationSelect",
                displayName: "Select Location"
            },
        ]
    });
    get isAdd() {
        return this.formModel.values.id == null;
    }

    constructor(weatherPanelModel) {
        super();
        makeObservable(this);

        this.parentModel = weatherPanelModel;
    }

    async submitAsync() {
        const {formModel, parentModel} = this,
            {values} = formModel,
            isValid = await formModel.validateAsync();

        if (isValid) {
            this.close();
            const {locationSelect} = values;
            await parentModel.addLocationAsync(locationSelect.name);
            //this.close();
        }
    }

    @action
    openAddForm() {
        this.isOpen = true;
        this.formModel.init();
    }

    @action
    close() {
        this.isOpen = false;
    }
}
