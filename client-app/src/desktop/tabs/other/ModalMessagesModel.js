/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {action, computed, bindable} from '@xh/hoist/mobx';


@HoistModel
export class ModalMessagesModel {

    DEFAULT_MESSAGES = {
        'message': 'This is an XH Message',
        'alert': 'Heads Up! This is an XH Alert!',
        'confirm': 'Are you sure you want to keep learning about XH modals?'
    };

    INTENT_OPTIONS = [
        {value: null, label: 'None'},
        {value: 'primary', label: 'Primary'},
        {value: 'success', label: 'Success'},
        {value: 'warning', label: 'Warning'},
        {value: 'danger', label: 'Danger'}
    ];


    @bindable modalType = 'message';
    @bindable message = 'This is a sample XH message.';
    @bindable title;
    @bindable icon;
    @bindable confirmText;
    @bindable cancelText;
    @bindable confirmIntent;
    @bindable cancelIntent;

    @action changeMessage() {
        this.message = this.DEFAULT_MESSAGES[this.modalType]
    }

    @computed
    get fnString() {
        const opts = {
            message: this.message,
            title: this.title,
            icon: this.icon,
            confirmText: this.confirmText,
            cancelText: this.cancelText,
            confirmIntent: this.confirmIntent,
            cancelIntent: this.cancelIntent
        };
        return `XH.${this.modalType}(${JSON.stringify(opts)})`;
    }

    @computed
    get modalInfo() {
        switch(this.modalType) {
            case 'message':
                return "Show a modal message dialog";
            case 'alert':
                return 'Show a modal dialog with default \'OK\' button';
            case 'confirm':
                return 'Show a modal dialog with default \'OK\'/\'Cancel\' buttons';
            default:
                console.log("BEEE");
                return ''
        }
    }


    constructor() {
        this.addReaction({
            track: () => [this.modalType],
            run: () => this.changeMessage()
        });
    }

    doAction() {
        const opts = {
            message: this.message,
            title: this.title,
            icon: this.icon,
            confirmText: this.confirmText,
            cancelText: this.cancelText,
            confirmIntent: this.confirmIntent,
            cancelIntent: this.cancelIntent
        };
        const fnString = `XH.${this.modalType}(${JSON.stringify(opts)})`;
        eval(fnString)
    }



    //------------------------
    // Implementation
    //------------------------


}