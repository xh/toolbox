/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {button} from '@xh/hoist/kit/blueprint';
import {HoistComponent} from '@xh/hoist/core';
import {message, MessageModel} from '@xh/hoist/cmp/message';
import {vframe, filler, panel} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/cmp/toolbar';
import {textAreaField} from '@xh/hoist/cmp/form';
import {ToastManager} from '@xh/hoist/toast';
import {Icon} from '@xh/hoist/icon';

import {wrapperPanel} from '../impl/WrapperPanel';

@HoistComponent()
export class MessagesPanel extends Component {

    localModel = new MessageModel({
        title: 'Warning',
        icon: Icon.warning({size: 'lg'})
    });

    render() {
        return wrapperPanel(
            panel({
                title: 'Mask Component',
                width: 600,
                height: 300,
                item: this.renderExample(),
                bbar: toolbar({
                    alignItems: 'baseline',
                    items: [
                        filler(),
                        button({
                            text: 'Submit w/Alert',
                            intent: 'danger',
                            onClick: this.onAlertClick
                        }),
                        button({
                            text: 'Submit w/Confirm',
                            intent: 'success',
                            onClick: this.onConfirmClick
                        })
                    ]
                })
            })
        );
    }

    renderExample() {
        return vframe({
            cls: 'xh-toolbox-example-container',
            items: [
                textAreaField({
                    placeholder: 'A common use for a message component is to show information upon form submission. ' +
                        'Messages can be shown as alerts or confirmations. An alert will present a user with information ' +
                        'without the ability to cancel the action that triggered the message. A confirmation ' +
                        'will require that the user confirm or cancel the action associated with the message.',
                    style: {height: 400}
                }),
                message({model: this.model})
            ]
        });
    }

    onAlertClick = () => {
        this.model.alert({
            message: 'This is an alert. It only requires an acknowledgement.',
            onConfirm: this.showToast
        });
    }


    onConfirmClick = () => {
        this.model.confirm({
            message: 'This is a confirmation. You may cancel or confirm it.',
            onConfirm: this.showToast
        });
    }

    showToast() {
        ToastManager.show({
            message: 'Submission Successful',
            intent: 'success'
        });
    }

}