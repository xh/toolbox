/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {observable, action} from '@xh/hoist/mobx';
import {box, filler} from '@xh/hoist/cmp/layout';
import {numberInput, textInput, switchInput} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {mask} from '@xh/hoist/desktop/cmp/mask';

import {sampleGrid, wrapper} from '../../common';


@HoistComponent
export class MaskPanel extends Component {

    @observable seconds = 6;
    @action     setSeconds(v) {this.seconds = v}

    @observable message = '';
    @action     setMessage(v) {this.message = v}

    @observable inline = true;
    @action     setInline(v) {this.inline = v}

    @observable spinner = true;
    @action     setSpinner(v) {this.spinner = v}

    maskModel = new PendingTaskModel();

    render() {

        return wrapper({
            description: [
                <p>
                    Masks provide a semi-opaque overlay to disable interaction with a component. They
                    are typically configured with a <code>PendingTaskModel</code>, which is a general
                    model class used to track the status of one or more asynchronous Promises. In
                    controlled mode, the model will reactively show/hide a bound mask while a linked
                    promise is pending.
                </p>,
                <p>
                    A convenient way to display a mask is via the <code>mask</code> property of Panel.
                    This prop can accept a fully configured mask element or simply <code>true</code>
                    to show a default mask. Either will be shown over the parent Panel.
                </p>,
                <p>
                    A mask configured with <code>inline: false</code> will mask the entire Viewport.
                </p>
            ],
            item: panel({
                title: 'Other > Mask',
                icon: Icon.eyeSlash(),
                width: 700,
                height: 400,
                item: sampleGrid({omitToolbar: true}),
                bbar: toolbar({
                    items: [
                        box('Mask for'),
                        numberInput({
                            model: this,
                            field: 'seconds',
                            width: 40,
                            min: 0,
                            max: 10
                        }),
                        box('secs with'),
                        textInput({
                            model: this,
                            field: 'message',
                            width: 120,
                            placeholder: 'optional text'
                        }),
                        switchInput({
                            model: this,
                            field: 'inline',
                            label: 'inline'
                        }),
                        switchInput({
                            model: this,
                            field: 'spinner',
                            label: 'with spinner'
                        }),
                        filler(),
                        button({
                            text: 'Show Mask',
                            intent: 'primary',
                            onClick: this.showMask
                        })
                    ]
                }),
                mask: mask({
                    spinner: this.spinner,
                    inline: this.inline,
                    model: this.maskModel
                })
            })
        });
    }

    showMask = () => {
        this.showMaskSequenceAsync().linkTo(this.maskModel);
    }

    @action
    async showMaskSequenceAsync() {
        const {maskModel, message, seconds} = this,
            interval = seconds / 3 * SECONDS;
        if (message) maskModel.setMessage(message);
        await wait(interval);
        if (message) maskModel.setMessage(message + ' - Still Loading...');
        await wait(interval);
        if (message) maskModel.setMessage(message + ' - Almost Finished...');
        await wait(interval);
    }
}