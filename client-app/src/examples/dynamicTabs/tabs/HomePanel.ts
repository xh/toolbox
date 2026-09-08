import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';

export const homePanel = hoistCmp.factory({
    render() {
        return panel({
            className: 'dynamic-tabs-content',
            item: div({
                style: {padding: 20},
                items: [
                    div({
                        style: {fontSize: 24, fontWeight: 'bold', marginBottom: 10},
                        item: 'Home'
                    }),
                    div(
                        'This is the Home tab. Use the toolbar above to open dynamic Item tabs by ID.'
                    )
                ]
            })
        });
    }
});
