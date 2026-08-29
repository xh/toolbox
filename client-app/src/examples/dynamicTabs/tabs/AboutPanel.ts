import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';

export const aboutPanel = hoistCmp.factory({
    render() {
        return panel({
            className: 'dynamic-tabs-content',
            item: div({
                style: {padding: 20},
                items: [
                    div({
                        style: {fontSize: 24, fontWeight: 'bold', marginBottom: 10},
                        item: 'About'
                    }),
                    div('This is the About tab. Placeholder content.')
                ]
            })
        });
    }
});
