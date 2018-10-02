/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {vframe, hbox, vspacer} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import {startCase} from 'lodash'
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/desktop/cmp/button';
import {ToastModel} from './ToastModel';
import {
    formField,
    numberInput,
    textInput,
    select
} from '@xh/hoist/desktop/cmp/form';
import './ModalMessagesPanel.scss';

/*
bject} config - options for toast instance.
* @param {string} config.message - the message to show in the toast.
* @param {element} [config.icon] - icon to be displayed
* @param {number} [config.timeout] - time in milliseconds to display the toast.
* @param {string} [config.intent] - The Blueprint intent (desktop only)
* @param {Object} [config.position] - Position in
  */
@HoistComponent
export class ToastPanel extends Component {

    localModel = new ToastModel();

    render() {
        const {modalType, fnString, INTENT_OPTIONS} = this.localModel,
            {localModel: model, numberField} = this;
        return wrapper({
            item: panel({
                title: `XH.toast`,
                height: 700,
                width: 700,
                className: 'toolbox-modals-panel',
                headerItems: [
                    button({
                        icon: Icon.refresh(),
                        minimal: true,
                        large: true,
                        onClick: () => XH.reloadApp()
                    })
                ],
                item: vframe({
                    items: [
                        formField({
                            item: textInput(),
                            label: 'Message',
                            field: 'message',
                            labelInfo: 'Message text to be displayed',
                            model
                        }),
                        hbox({
                            items: [
                                numberField({
                                    field: 'timeout',
                                    info: 'Display time (ms)'
                                }),
                                numberField({
                                    field: 'position',
                                    info: 'Blueprint position'
                                })
                            ]
                        }),
                        hbox({
                            items: [
                                formField({
                                    item: select({
                                        options: INTENT_OPTIONS
                                    }),
                                    label: 'Intent',
                                    field: 'intent',
                                    labelInfo: 'Blueprint button intent',
                                    model
                                })
                            ]
                        }),
                        vspacer(20),
                        hbox({
                            items: [
                                button({
                                    text: 'Display modal',
                                    onClick: () => eval(fnString)
                                }),
                                button({
                                    text: 'Copy code to clipboard',
                                    onClick: () => {
                                        navigator.clipboard.writeText(fnString);
                                        XH.toast({message: 'Copied code to clipboard'});
                                    }
                                })
                            ]
                        })
                    ]
                })
            })
        })
    }

    numberField = ({field, info}) => {
        const {localModel: model} = this;
        const label = startCase(field);
        return formField({
            item: numberInput(),
            label: label,
            field: field,
            labelInfo: info,
            model
        })
    }

    //------------------------
    // Implementation


}