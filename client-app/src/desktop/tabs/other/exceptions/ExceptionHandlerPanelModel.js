import {HoistModel, managed} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class ExceptionHandlerModel extends HoistModel {
    @bindable
    showSourceCode = false;

    @managed
    formModel = new FormModel({
        fields: [
            {name: 'message', initialValue: ''},
            {name: 'title', initialValue: ''},
            {name: 'showAsError', initialValue: true},
            {name: 'logOnServer', initialValue: true},
            {name: 'showAlert', initialValue: true},
            {name: 'alertType', initialValue: 'dialog'},
            {name: 'requireReload', initialValue: false},
            {name: 'hideParams'}

        ]
    })

    get exceptionOptions() {
        const options = {},
            {fields} = this.formModel;
        for (let key in fields) {
            const field = fields[key];
            options[field.name] = field.value;
        }
        return options;
    }

    constructor() {
        super();
        makeObservable(this);
    }

    throwException() {
        try {
            throw 'Simulated exception';
        } catch (e) {
            XH.handleException(e, this.exceptionOptions);
        }
    }
}