import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {box, div, vbox} from '@xh/hoist/cmp/layout';

export const vboxPage = hoistCmp.factory({
    render() {
        const defaults = {padding: 10, className: 'toolbox-containers-box'};

        return panel({
            className: 'toolbox-containers-page',
            items: [
                div({
                    className: 'toolbox-description',
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
