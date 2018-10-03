/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {action, computed, bindable} from '@xh/hoist/mobx';
import {field, FieldSupport, lengthIs, required} from '@xh/hoist/field';


@FieldSupport
@HoistModel
export class ModalMessagesModel {

    DEFAULT_MESSAGES = {
        'message': 'This is an XH Message',
        'alert': 'Heads Up! This is an XH Alert.',
        'confirm': 'Are you sure you want to keep learning about XH modals?'
    };

    INTENT_OPTIONS = [
        {value: null, label: 'None'},
        {value: 'primary', label: 'Primary'},
        {value: 'success', label: 'Success'},
        {value: 'warning', label: 'Warning'},
        {value: 'danger', label: 'Danger'}
    ];


    @field('Type')
    modalType;
    @field('Message')
    message;
    @field('Title')
    title;
    @field('Confirm Text')
    confirmText;
    @field('Cancel Text')
    cancelText;
    @field('Confirm Intent')
    confirmIntent;
    @field('Cancel Intent')
    cancelIntent;

    constructor() {
        this.initFields({
            modalType: 'message',
            message: 'This is an XH Message Dialog',
            title: null,
            confirmText: null,
            cancelText: null,
            confirmIntent: null,
            cancelIntent: null
        });
        this.addReaction({
            track: () => [this.modalType],
            run: () => this.changeMessage()
        });
        this.addReaction({
            track: () => [this.fnString],
            run: () => this.changeMessage()
        });
    }

    @action changeMessage() {
        this.message = this.DEFAULT_MESSAGES[this.modalType]
    }

    @computed
    get fnString() {
        const {modalType, message, title, confirmText, cancelText, confirmIntent, cancelIntent} = this;
        const opts = {};
        Object.assign(
            opts,
            {message},
            title ? {title} : null,
            confirmText ? {confirmText} : null,
            cancelText ? {cancelText} : null,
            confirmIntent ? {confirmIntent} : null,
            cancelIntent ? {cancelIntent} : null
        );
        return `XH.${modalType}(${JSON.stringify(opts)})`;
    }


    // fmtFn(str) {
    //     str = str.replace(/'/g, "");
    //     str = str.replace(/\"/g, "");
    //     str = str.replace(/,/,"',");
    //     str = str.replace(/:/,":'");
    //     str = str.replace(/}/,"'}");
    //     return str
    // }

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
                return ''
        }
    }



}