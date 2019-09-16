import React from 'react';
import {hoistCmp, HoistModel, creates, managed} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {span} from '@xh/hoist/cmp/layout';
import {numberInput, textInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {mask} from '@xh/hoist/desktop/cmp/mask';

import {sampleGrid, wrapper} from '../../common';

export const MaskPanel = hoistCmp({
    model: creates(() => new Model()),

    render({model}) {
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
            links: [
                {url: '$TB/client-app/src/desktop/tabs/panels/MaskPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/mask/Mask.js', notes: 'Hoist component.'},
                {url: '$HR/utils/async/PendingTaskModel.js', notes: 'Hoist model for tracking async tasks - can be linked to masks.'}
            ],
            item: panel({
                title: 'Panels › Mask',
                icon: Icon.mask({prefix: 'fas'}),
                width: 800,
                height: 400,
                item: sampleGrid({omitGridTools: true}),
                bbar: [
                    span('Mask for'),
                    numberInput({
                        bind: 'seconds',
                        width: 40,
                        min: 0,
                        max: 10
                    }),
                    span('secs with'),
                    textInput({
                        bind: 'message',
                        width: 120,
                        placeholder: 'optional text'
                    }),
                    toolbarSep(),
                    switchInput({
                        bind: 'inline',
                        label: 'Inline:',
                        labelAlign: 'left'
                    }),
                    toolbarSep(),
                    switchInput({
                        bind: 'spinner',
                        label: 'Spinner:',
                        labelAlign: 'left'
                    }),
                    toolbarSep(),
                    button({
                        text: 'Show Mask',
                        intent: 'success',
                        onClick: () => model.showMask()
                    })
                ],
                mask: mask({
                    spinner: model.spinner,
                    inline: model.inline,
                    model: model.maskModel
                })
            })
        });
    }
});

@HoistModel
class Model {

    @bindable seconds = 6;
    @bindable message = '';
    @bindable inline = true;
    @bindable spinner = true;

    @managed
    maskModel = new PendingTaskModel();

    showMask() {
        this.showMaskSequenceAsync().linkTo(this.maskModel);
    }

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