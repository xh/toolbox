/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {start, wait, PendingTaskModel} from '@xh/hoist/promise';
import {observable, action, runInAction} from '@xh/hoist/mobx';
import {box, filler} from '@xh/hoist/cmp/layout';
import {numberField, textField, switchField} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';

import {loadMask} from '@xh/hoist/desktop/cmp/mask';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {SECONDS} from '@xh/hoist/utils/DateTimeUtils';
import {wrapper, sampleGrid} from '../../common';


@HoistComponent()
export class LoadMaskPanel extends Component {
    @observable maskIsShown = false;
    @observable seconds = 3;
    @observable maskViewport = false;

    maskModel = new PendingTaskModel();

    render() {
        const {maskText, maskViewport, maskIsShown, maskModel} = this;

        return wrapper({
            description: <p>
                LoadMask adds a spinner to the default mask component. It can optionally be
                dynamically controlled by a linked PendingTaskModel. It can also be
                placed over the entire viewport with <code>inline:false</code>.
            </p>,
            item: panel({
                title: 'Other > LoadMask',
                width: 700,
                height: 400,
                items: [
                    sampleGrid({omitToolbar: true}),
                    loadMask({
                        model: maskModel,
                        inline: !maskViewport
                    })
                ],
                bbar: toolbar({
                    items: [
                        box('Mask for'),
                        numberField({
                            model: this,
                            field: 'seconds',
                            width: 40,
                            min: 0,
                            max: 10
                        }),
                        box('secs with'),
                        switchField({
                            model: this,
                            field: 'maskViewport'
                        }),
                        box({
                            className: 'xh-no-pad',
                            item: 'on viewport'
                        }),
                        filler(),
                        button({
                            text: 'Show Mask',
                            intent: 'primary',
                            disabled: maskIsShown,
                            onClick: this.showMask
                        })
                    ]
                })
            })
        });
    }

    showMask = () => {
        start(() => this.showMaskSequenceAsync()).linkTo(this.maskModel)
    }

    @action
    async showMaskSequenceAsync() {
        const maskModel = this.maskModel,
            interval = this.seconds/3 * SECONDS;
        maskModel.setMessage('Loading...');
        await wait(interval);
        maskModel.setMessage('Still Loading...');
        await wait(interval);
        maskModel.setMessage('Almost Finished...');
        await wait(interval);
    }

    @action
    setSeconds(seconds) {
        this.seconds = seconds;
    }

    @action
    setMaskText(maskText) {
        this.maskText = maskText;
    }

    @action
    setMaskViewport(maskViewport) {
        this.maskViewport = maskViewport;
    }
}