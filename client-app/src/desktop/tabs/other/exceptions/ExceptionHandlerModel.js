import {HoistModel} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class ExceptionHandlerModel extends HoistModel {

    // For example options:
    @bindable title = '';
    @bindable message = '';
    @bindable logOnServer = true;
    @bindable showAlert = true;
    @bindable showAsError = true;
    @bindable requireReload = false;
    @bindable alertType = 'dialog';

    constructor() {
        super();
        makeObservable(this);
    }

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
            const {title, message, logOnServer, showAlert, showAsError, requireReload, alertType} = this;
            XH.handleException(e, {
                title,
                message,
                logOnServer,
                showAlert,
                showAsError,
                requireReload,
                alertType
            });
        }
    }
}