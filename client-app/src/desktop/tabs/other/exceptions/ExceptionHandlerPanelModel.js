import {HoistModel, managed} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {XH} from '@xh/hoist/core';

export class ExceptionHandlerModel extends HoistModel {

    @managed
    formModel = new FormModel({
        fields: [
            {name: 'title', initialValue: ''},
            {name: 'message', initialValue: ''},
            {name: 'showAsError', initialValue: true},
            {name: 'requireReload', initialValue: false},
            {name: 'showAlert', initialValue: true},
            {name: 'alertType', initialValue: 'dialog'}
        ]
    })

    throwException(type) {
        const message = type === 'routine' ?
            `User does not have permission to click this button after ${new Date().toLocaleTimeString()}!` :
            'This is a very problematic button and has caused your Hoist app to crash!';
        try {
            throw XH.exception({
                message,
                isRoutine: type === 'routine'
            });
        } catch (e) {
            XH.handleException(e, this.formModel.getData());
        }
    }
}