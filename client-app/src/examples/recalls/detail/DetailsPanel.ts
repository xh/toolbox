import {hoistCmp, creates} from '@xh/hoist/core';
import {DetailsPanelModel} from './DetailsPanelModel';
import {panel} from '@xh/hoist/desktop/cmp/panel';

export const detailsPanel = hoistCmp.factory({
    model: creates(DetailsPanelModel),

    render({model}) {
        // const {testObj} = model;
        console.log('render component');

        return panel({
            title: 'Details',
            item: 'detailPanel'
        });
    }
});
