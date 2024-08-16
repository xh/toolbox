import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {box, div, vbox} from '@xh/hoist/cmp/layout';

export const vboxPage = hoistCmp.factory({
    render() {
        const defaults = {padding: 10, className: 'tb-containers-box'};

        return panel({
            className: 'tb-containers-page',
            items: [
                div({
                    className: 'tb-description',
                    item: `
                        A vbox lays out its children vertically, rendering a box with flexDirection 
                        set to column.
                    `
                }),
                vbox(
                    box({...defaults, flex: 1, item: 'flex: 1'}),
                    box({...defaults, height: 80, item: 'height: 80'}),
                    box({...defaults, flex: 2, item: 'flex: 2'})
                )
            ]
        });
    }
});
