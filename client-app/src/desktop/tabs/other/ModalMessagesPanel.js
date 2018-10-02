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
import {startCase} from 'lodash'
import {Icon} from '@xh/hoist/icon';
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
        const {modalType, confirmText, cancelText, fnString, modalInfo, INTENT_OPTIONS} = this.localModel,
            {localModel: model, textField} = this;
        return wrapper({
            item: panel({
                title: `XH.${modalType}()`,
                height: 700,
                width: 700,
                className: 'toolbox-modals-panel',
                headerItems: [
                    button({
                        icon: Icon.refresh(),
                        minimal: true,
                        large: true,
                        onClick: () => model.clear()
                    })
                ],
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
                            labelInfo: modalInfo,
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
                                    labelInfo: 'Blueprint button intent',
                                    disabled: !confirmText,
                                    model
                                }),
                                formField({
                                    item: select({
                                        options: INTENT_OPTIONS
                                    }),
                                    label: 'Cancel Intent',
                                    field: 'cancelIntent',
                                    labelInfo: 'Blueprint button intent',
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
                                    text: 'Copy code to clipboard',
                                    onClick: () => navigator.clipboard.writeText(fnString)
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