import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {numberInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {mask} from '@xh/hoist/cmp/mask';
import {sampleGrid, SampleGridModel, wrapper, wrapperOption} from '../../common';

export const maskPanel = hoistCmp.factory({
    model: creates(() => MaskPanelModel),

    render({model}) {
        return wrapper({
            title: 'Mask',
            icon: Icon.mask({prefix: 'fas'}),
            description: [
                'Masks provide a semi-opaque overlay to disable interaction with a component.',
                '',
                'A convenient way to display a mask is via the `mask` property of `Panel`.',
                'This prop can accept a fully configured `mask` element, `true` for a plain',
                'default mask, or (most commonly) a `TaskObserver` instance to automatically',
                'show a mask with a spinner when a task is pending.',
                '',
                'A mask configured with `inline: false` will mask the entire `Viewport`.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/MaskPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/panel/README.md#mask',
                    text: 'Panel docs',
                    notes: 'Desktop panel guide, including the mask prop.'
                },
                {url: '$HR/cmp/mask/Mask.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/core/TaskObserver.ts',
                    notes: 'Hoist model for tracking async tasks - can be linked to masks.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Load for (secs)',
                    control: numberInput({model, bind: 'seconds', width: 70, min: 0, max: 10})
                }),
                wrapperOption({
                    label: 'Message',
                    control: textInput({
                        model,
                        bind: 'message',
                        width: 150,
                        placeholder: 'optional text'
                    })
                }),
                wrapperOption({
                    label: 'Inline',
                    control: switchInput({model, bind: 'inline'})
                }),
                wrapperOption({
                    label: 'Spinner',
                    control: switchInput({model, bind: 'spinner'})
                }),
                button({
                    text: 'Load Now',
                    icon: Icon.refresh(),
                    intent: 'primary',
                    width: '100%',
                    onClick: () => model.refreshAsync()
                })
            ],
            item: panel({
                title: 'Mask',
                icon: Icon.mask({prefix: 'fas'}),
                height: '60vh',
                width: '90%',
                item: sampleGrid({omitGridTools: true, omitMask: true}),
                mask: mask({
                    spinner: model.spinner,
                    inline: model.inline,
                    bind: model.loadObserver
                })
            })
        });
    }
});

class MaskPanelModel extends HoistModel {
    @bindable seconds = 3;
    @bindable message = '';
    @bindable inline = true;
    @bindable spinner = true;

    @managed sampleGridModel = new SampleGridModel();

    constructor() {
        super();
        makeObservable(this);
    }

    override async doLoadAsync(loadSpec) {
        const {loadObserver, message, seconds} = this,
            interval = (seconds / 3) * SECONDS;
        loadObserver.setMessage(message);
        await this.sampleGridModel.loadAsync(loadSpec);
        await wait(interval);
        if (message) loadObserver.setMessage(message + ' - still loading...');
        await wait(interval);
        if (message) loadObserver.setMessage(message + ' - almost finished...');
        await wait(interval);
        loadObserver.setMessage(message);
    }
}
