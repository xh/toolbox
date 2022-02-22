import {hoistCmp, HoistModel, creates} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {div, filler, h1, p} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {popover} from '@xh/hoist/mobile/cmp/popover';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';

import './PopoverPage.scss';

export const popoverPage = hoistCmp.factory({
    model: creates(() => PopoverPageModel),
    render({model}) {
        return panel({
            title: 'Popovers',
            icon: Icon.openExternal(),
            className: 'toolbox-page xh-tiled-bg',
            items: [
                filler(),
                popoverCard({
                    text: 'Show Popover below',
                    popoverProps: {
                        position: 'bottom'
                    }
                }),
                popoverCard({
                    text: 'Show Popover with backdrop',
                    popoverProps: {
                        backdrop: true
                    }
                }),
                popoverCard({
                    text: 'Show controlled Popover',
                    popoverProps: {
                        isOpen: model.isOpen,
                        onInteraction: (nextOpenState) => model.setIsOpen(nextOpenState)
                    }
                }),
                filler()
            ]
        });
    }
});

const popoverCard = hoistCmp.factory({
    render({text, popoverProps}) {
        return div({
            className: 'toolbox-card',
            item: popover({
                target: button({text}),
                content: popoverContent,
                ...popoverProps
            })
        });
    }
});

const popoverContent = hoistCmp.factory({
    render() {
        return div({
            className: 'toolbox-popover',
            items: [
                h1('Hello!'),
                p('I am a Popover.')
            ]
        });
    }
});

/**
 * LocalModel used to demonstrate opening a Popover in controlled mode
 */
class PopoverPageModel extends HoistModel {
    @bindable isOpen = false;

    constructor() {
        super();
        makeObservable(this);
    }
}