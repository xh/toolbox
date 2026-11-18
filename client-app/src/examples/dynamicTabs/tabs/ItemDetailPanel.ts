import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';

export const itemDetailPanel = hoistCmp.factory({
    render({itemId}) {
        return panel({
            className: 'dynamic-tabs-content',
            item: div({
                style: {padding: 20},
                items: [
                    div({
                        style: {fontSize: 32, fontWeight: 'bold', marginBottom: 10},
                        item: `Detail for Item ${itemId}`
                    }),
                    div(`This is a dynamically created tab for item ${itemId}.`)
                ]
            })
        });
    }
});
