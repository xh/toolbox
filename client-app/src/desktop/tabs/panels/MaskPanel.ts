import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {numberInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {mask} from '@xh/hoist/cmp/mask';
import {sampleGrid, SampleGridModel, wrapper, wrapperAction, wrapperOption} from '../../common';

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
                    propName: 'MaskProps.message',
                    control: textInput({
                        model,
                        bind: 'message',
                        width: 150,
                        placeholder: 'optional text'
                    })
                }),
                wrapperOption({
                    label: 'Inline',
                    propName: 'MaskProps.inline',
                    control: switchInput({model, bind: 'inline'}),
                    info: 'Mask this panel, not the viewport.'
                }),
                wrapperOption({
                    label: 'Spinner',
                    propName: 'MaskProps.spinner',
                    control: switchInput({model, bind: 'spinner'})
                }),
                wrapperAction({
                    // Bind to the same TaskObserver that drives the mask, so the trigger itself
                    // reflects the loading state it kicks off.
                    text: model.loadObserver.isPending ? 'Loading...' : 'Load Now',
                    icon: model.loadObserver.isPending
                        ? Icon.spinner({spin: true})
                        : Icon.refresh(),
                    intent: 'primary',
                    disabled: model.loadObserver.isPending,
                    onClick: () => model.refreshAsync()
                })
            ],
            item: panel({
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
    @bindable accessor seconds = 3;
    @bindable accessor message = '';
    @bindable accessor inline = true;
    @bindable accessor spinner = true;

    @managed sampleGridModel = new SampleGridModel();

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
