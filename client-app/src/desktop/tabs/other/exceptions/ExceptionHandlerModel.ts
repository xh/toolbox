import {HoistModel} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class ExceptionHandlerModel extends HoistModel {
    // For example options:
    @bindable title = '';
    @bindable message = '';
    @bindable logOnServer = true;
    @bindable showAlert = true;
    @bindable requireReload = false;
    @bindable alertType: 'dialog' | 'toast' = 'dialog';

    constructor() {
        super();
        makeObservable(this);
    }

    throwException(type: 'standard' | 'routine') {
        const message =
            type === 'routine'
                ? `User does not have permission to click this button after ${new Date().toLocaleTimeString()}!`
                : 'This is a very problematic button and has encountered a serious error.';
        try {
            throw XH.exception({
                message,
                isRoutine: type === 'routine'
            });
        } catch (e) {
            const {title, message, logOnServer, showAlert, requireReload, alertType} = this;
            XH.handleException(e, {
                title,
                message,
                logOnServer,
                showAlert,
                requireReload,
                alertType
            });
        }
    }
}
