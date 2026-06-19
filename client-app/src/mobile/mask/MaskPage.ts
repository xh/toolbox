import {frame, p} from '@xh/hoist/cmp/layout';
import {mask} from '@xh/hoist/cmp/mask';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {exampleAction, exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './MaskPage.scss';

export const maskPage = hoistCmp.factory({
    model: creates(() => MaskPageModel),

    render({model}) {
        const {masked, spinner, showMessage} = model;
        return exampleScreen({
            title: 'Mask',
            icon: Icon.mask(),
            description: [
                '`Mask` overlays content with a semi-transparent layer and an optional spinner and',
                'message - used to block interaction and signal that work is underway.',
                '',
                'In practice a `Mask` (or a `Panel`s `mask` prop) is usually bound to a `TaskObserver`',
                'so it shows automatically while an async task runs. Toggle the options here, or tap',
                '"Mask for 3 seconds" to simulate a load.'
            ],
            options: [
                exampleOption({
                    label: 'Show mask',
                    control: switchInput({model, bind: 'masked'})
                }),
                exampleOption({
                    label: 'Spinner',
                    control: switchInput({model, bind: 'spinner'})
                }),
                exampleOption({
                    label: 'Message',
                    control: switchInput({model, bind: 'showMessage'})
                }),
                exampleAction({
                    text: 'Mask for 3 seconds',
                    icon: Icon.clock(),
                    onClick: () => model.maskForAWhile()
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/mask/MaskPage.ts', notes: 'This example.'},
                {url: '$HR/cmp/mask/Mask.ts', text: 'Mask source'}
            ],
            item: panel({
                className: 'tb-page',
                item: frame({
                    className: 'tb-mask-page__stage',
                    items: [
                        p(
                            'This content sits behind the mask. While masked, it is dimmed and cannot be interacted with.'
                        ),
                        mask({
                            isDisplayed: masked,
                            spinner,
                            message: showMessage ? 'Loading data...' : null
                        })
                    ]
                })
            })
        });
    }
});

class MaskPageModel extends HoistModel {
    @bindable masked: boolean = false;
    @bindable spinner: boolean = true;
    @bindable showMessage: boolean = true;

    constructor() {
        super();
        makeObservable(this);
    }

    maskForAWhile() {
        this.masked = true;
        wait(3000).thenAction(() => (this.masked = false));
    }
}
