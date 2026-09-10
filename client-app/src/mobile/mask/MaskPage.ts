import {p, vframe} from '@xh/hoist/cmp/layout';
import {mask} from '@xh/hoist/cmp/mask';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {bindable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
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
                'so it shows automatically while an async task runs. Toggle the display options here,',
                'or tap the button on the example to mask it briefly while a simulated load runs.'
            ],
            options: [
                exampleOption({
                    label: 'Spinner',
                    control: switchInput({model, bind: 'spinner'})
                }),
                exampleOption({
                    label: 'Message',
                    control: switchInput({model, bind: 'showMessage'})
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/mask/MaskPage.ts', notes: 'This example.'},
                {url: '$HR/cmp/mask/Mask.ts', text: 'Mask source'}
            ],
            item: panel({
                className: 'tb-page',
                item: vframe({
                    className: 'tb-mask-page__stage',
                    items: [
                        p(
                            'This content sits behind the mask. While masked, it is dimmed and cannot be interacted with.'
                        ),
                        button({
                            text: 'Mask for 3 seconds',
                            icon: Icon.clock(),
                            intent: 'primary',
                            onClick: () => model.maskForAWhile()
                        }),
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
    @bindable accessor masked: boolean = false;
    @bindable accessor spinner: boolean = true;
    @bindable accessor showMessage: boolean = true;

    maskForAWhile() {
        this.masked = true;
        wait(3000).thenAction(() => (this.masked = false));
    }
}
