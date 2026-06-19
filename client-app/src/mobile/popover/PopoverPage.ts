import {hoistCmp, HoistModel, creates} from '@xh/hoist/core';
import {bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {div, filler, h1, p} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {popover} from '@xh/hoist/mobile/cmp/popover';
import {button} from '@xh/hoist/mobile/cmp/button';
import {select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';

import './PopoverPage.scss';

type PopoverPosition = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export const popoverPage = hoistCmp.factory({
    model: creates(() => PopoverPageModel),
    render({model}) {
        return exampleScreen({
            title: 'Popovers',
            icon: Icon.openExternal(),
            description: [
                '`Popover` displays floating content anchored to a target element, with optional',
                'backdrop and controlled open state. Adjust the options here to reposition the first',
                'popover, then tap a button below to open it.'
            ],
            options: [
                exampleOption({
                    label: 'Position',
                    control: select({
                        width: 130,
                        model,
                        bind: 'position',
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {value: 'auto', label: 'Auto'},
                            {value: 'top', label: 'Top'},
                            {value: 'bottom', label: 'Bottom'},
                            {value: 'left', label: 'Left'},
                            {value: 'right', label: 'Right'}
                        ]
                    })
                }),
                exampleOption({
                    label: 'Backdrop',
                    control: switchInput({model, bind: 'backdrop'}),
                    info: 'Dim the rest of the screen behind the popover.'
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/popover/PopoverPage.ts', notes: 'This example.'},
                {url: '$HR/mobile/cmp/popover/Popover.ts', text: 'Popover source'}
            ],
            item: panel({
                className: 'tb-page xh-tiled-bg',
                items: [
                    filler(),
                    popoverCard({
                        text: 'Configurable Popover',
                        popoverProps: {position: model.position, backdrop: model.backdrop}
                    }),
                    popoverCard({
                        text: 'Controlled Popover',
                        popoverProps: {
                            isOpen: model.isOpen,
                            onInteraction: nextOpenState => (model.isOpen = nextOpenState)
                        }
                    }),
                    filler()
                ]
            })
        });
    }
});

const popoverCard = hoistCmp.factory({
    render({text, popoverProps}) {
        return div({
            className: 'tb-card',
            item: popover({
                item: button({text}),
                content: popoverContent,
                ...popoverProps
            })
        });
    }
});

const popoverContent = hoistCmp.factory({
    render() {
        return div({
            className: 'tb-popover',
            items: [h1('Hello!'), p('I am a Popover.')]
        });
    }
});

/**
 * LocalModel used to drive the configurable and controlled Popover examples.
 */
class PopoverPageModel extends HoistModel {
    @bindable position: PopoverPosition = 'bottom';
    @bindable backdrop: boolean = false;
    @observable isOpen: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }
}
