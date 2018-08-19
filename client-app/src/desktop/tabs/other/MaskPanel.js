/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {observable, action} from '@xh/hoist/mobx';
import {box, filler} from '@xh/hoist/cmp/layout';
import {numberField, textField, switchField} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {mask} from '@xh/hoist/desktop/cmp/mask';

import {sampleGrid, wrapper} from '../../common';


@HoistComponent()
export class MaskPanel extends Component {

    @observable seconds = 3;
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
            description: `
                Masks provide a semi-opaque overlay to disable interaction with a component.
                The most convenient way to display a mask is via the masked property of Panel.
            `,
            item: panel({
                title: 'Other > Mask',
                width: 700,
                height: 400,
                item: sampleGrid({omitToolbar: true}),
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
                        textField({
                            model: this,
                            field: 'message',
                            width: 120,
                            placeholder: 'optional text'
                        }),
                        switchField({
                            model: this,
                            field: 'inline'
                        }),
                        box({className: 'xh-no-pad', item: 'inline'}),
                        switchField({
                            model: this,
                            field: 'spinner'
                        }),
                        box({className: 'xh-no-pad', item: 'with spinner'}),
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