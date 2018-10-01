/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {vframe, hbox, vspacer} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import {observable} from 'mobx';
import {startCase} from 'lodash'
import {button} from '@xh/hoist/desktop/cmp/button';
import {ModalMessagesModel} from './ModalMessagesModel';
import {
    formField,
    checkBox,
    dateInput,
    textInput,
    textArea,
    numberInput,
    radioInput,
    slider,
    select,
    multiSelect,
    switchInput,
    comboBox,
    queryComboBox,
    jsonInput,
    buttonGroupInput
} from '@xh/hoist/desktop/cmp/form';
import './ModalMessagesPanel.scss';

@HoistComponent
export class ModalMessagesPanel extends Component {

    localModel = new ModalMessagesModel();

    render() {
        const {modalType, confirmText, cancelText, INTENT_OPTIONS} = this.localModel,
            {localModel: model, textField} = this;
        return wrapper({
            item: panel({
                title: `XH.${modalType}()`,
                height: 700,
                width: 700,
                className: 'toolbox-modals-panel',
                item: vframe({
                    items: [
                        formField({
                            item: radioInput({
                                alignIndicator: 'right',
                                inline: true,
                                options: [
                                    {value: 'message', label: 'Message'},
                                    {value: 'alert', label: 'Alert'},
                                    {value: 'confirm', label: 'Confirm'}
                                ]
                            }),
                            label: 'Modal Type',
                            field: 'modalType',
                            model
                        }),
                        textField({
                            field: 'title',
                            info: 'Title of the message box'
                        }),
                        textField({
                            field: 'message',
                            info: 'Message text to be displayed'
                        }),
                        hbox({
                            items: [
                                textField({
                                    field: 'confirmText',
                                    info: 'Text for confirm button'
                                }),
                                textField({
                                    field: 'cancelText',
                                    info: 'Text for cancel button'
                                })
                            ]
                        }),
                        hbox({
                            items: [
                                formField({
                                    item: select({
                                        options: INTENT_OPTIONS
                                    }),
                                    label: 'Confirm Intent',
                                    field: 'confirmIntent',
                                    labelInfo: 'Blueprint Intent for confirm button',
                                    disabled: !confirmText,
                                    model
                                }),
                                formField({
                                    item: select({
                                        options: INTENT_OPTIONS
                                    }),
                                    label: 'Cancel Intent',
                                    field: 'cancelIntent',
                                    labelInfo: 'Blueprint Intent for cancel button',
                                    disabled: !cancelText,
                                    model
                                })
                            ]
                        }),
                        vspacer(20),
                        hbox({
                            items: [
                                button({
                                    text: 'Display modal',
                                    onClick: () => model.doAction()
                                }),
                                button({
                                    text: 'Copy code to clipboard'
                                })
                            ]
                        })
                    ]
                })
            })
        })
    }

    textField = ({field, info}) => {
        const {localModel: model} = this;
        const label = startCase(field);
        console.log(info);
        return formField({
            item: textInput(),
            label: label,
            field: field,
            labelInfo: info,
            model
        })
    }

    //------------------------
    // Implementation


}