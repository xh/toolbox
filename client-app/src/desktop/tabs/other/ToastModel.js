/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {action, computed, bindable} from '@xh/hoist/mobx';


@HoistModel
export class ToastModel {


    INTENT_OPTIONS = [
        {value: null, label: 'None'},
        {value: 'primary', label: 'Primary'},
        {value: 'success', label: 'Success'},
        {value: 'warning', label: 'Warning'},
        {value: 'danger', label: 'Danger'}
    ];

    @bindable message = 'This is an XH toast.';
    @bindable icon;
    @bindable timeout;
    @bindable intent;
    @bindable position;


    @computed
    get fnString() {
        const opts = {
            message: this.message,
            timeout: this.timeout,
            icon: this.icon,
            intent: this.intent,
            position: this.position
        };
        return `XH.toast(${JSON.stringify(opts)})`;
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