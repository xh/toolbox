import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {box, div, hbox} from '@xh/hoist/cmp/layout';

export const hboxPage = hoistCmp.factory({
    render() {
        const defaults = {padding: 10, className: 'toolbox-containers-box'};

        return panel({
            className: 'toolbox-containers-page',
            items: [
                div({
                    className: 'toolbox-description',
                    item: `
                        An hbox lays out its children horizontally, rendering a box with flexDirection 
                        set to row.
                    `
                }),
                hbox(
                    box({...defaults, flex: 1, item: 'flex: 1'}),
                    box({...defaults, width: 80, item: 'width: 80'}),
                    box({...defaults, flex: 2, item: 'flex: 2'})
                )
            ]
        });
    }
});
