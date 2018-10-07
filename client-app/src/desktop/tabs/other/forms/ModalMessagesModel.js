/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {HoistModel} from '@xh/hoist/core/index';
import {action, computed} from '@xh/hoist/mobx/index';
import {field, FieldSupport} from '@xh/hoist/field/index';


@FieldSupport
@HoistModel
export class ModalMessagesModel {

    DEFAULT_MESSAGES = {
        'message': 'This is an XH Message',
        'alert': 'Heads Up! This is an XH Alert.',
        'confirm': 'Is this an XH Confirm?'
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
            message: 'This is an XH Message',
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
    }

    @action changeMessage() {
        this.message = this.DEFAULT_MESSAGES[this.modalType];
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
        return this.fmtFn(`XH.${modalType}(${JSON.stringify(opts)})`);
    }

    @computed
    get modalInfo() {
        switch (this.modalType) {
            case 'message':
                return 'Show a modal message dialog';
            case 'alert':
                return 'Show a modal dialog with default \'OK\' button';
            case 'confirm':
                return 'Show a modal dialog with default \'OK\'/\'Cancel\' buttons';
            default:
                return '';
        }
    }

    onResetClick() {
        this.resetFields();
    }

    // IMPLEMENTATION //

    fmtFn(str) {
        str = str
            .replace(/\({/, '({\n\t')
            .replace(/'/g, '')
            .replace(/"/g, '')
            .replace(/,/g, "',\n\t")
            .replace(/:/g, ":'")
            .replace(/}/g, "'}")
            .replace(/}\)(?!.*}\))/, '\n})');
        return str;
    }
}