import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {action, bindable} from '@xh/hoist/mobx';
import {span} from '@xh/hoist/cmp/layout';
import {numberInput, textInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {mask} from '@xh/hoist/desktop/cmp/mask';

import {sampleGrid, wrapper} from '../../common';


@HoistComponent
export class MaskPanel extends Component {

    @bindable seconds = 6;
    @bindable message = '';
    @bindable inline = true;
    @bindable spinner = true;

    maskModel = new PendingTaskModel();

    render() {
        return wrapper({
            description: [
                <p>
                    Masks provide a semi-opaque overlay to disable interaction with a component.
                </p>,
                <p>
                    A convenient way to display a mask is via the <code>mask</code> property of Panel.
                    This prop can accept a fully configured mask element, <code>true</code> for a
                    plain default mask, or (most commonly) a <code>PendingTaskModel</code> instance
                    to automatically show a mask with a spinner when a linked promise is pending.
                </p>,
                <p>
                    A mask configured with <code>inline: false</code> will mask the entire Viewport.
                </p>
            ],
            item: panel({
                title: 'Panels › Mask',
                icon: Icon.mask({prefix: 'fas'}),
                width: 800,
                height: 400,
                item: sampleGrid({omitToolbars: true}),
                bbar: toolbar({
                    items: [
                        span('Mask for'),
                        numberInput({
                            model: this,
                            bind: 'seconds',
                            width: 40,
                            min: 0,
                            max: 10
                        }),
                        span('secs with'),
                        textInput({
                            model: this,
                            bind: 'message',
                            width: 120,
                            placeholder: 'optional text'
                        }),
                        toolbarSep(),
                        switchInput({
                            model: this,
                            bind: 'inline',
                            label: 'Inline:',
                            labelAlign: 'left'
                        }),
                        toolbarSep(),
                        switchInput({
                            model: this,
                            bind: 'spinner',
                            label: 'Spinner:',
                            labelAlign: 'left'
                        }),
                        toolbarSep(),
                        button({
                            text: 'Show',
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
        maskModel.setMessage(message);
        await wait(interval);
        if (message) maskModel.setMessage(message + ' - Still Loading...');
        await wait(interval);
        if (message) maskModel.setMessage(message + ' - Almost Finished...');
        await wait(interval);
    }
}