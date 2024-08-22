import {hoistCmp, uses} from '@xh/hoist/core';
import {DetailsPanelModel} from './DetailsPanelModel';
import {testPanel} from './TestPanel';
import {panel} from '@xh/hoist/desktop/cmp/panel';

export const detailsPanel = hoistCmp.factory({
    model: uses(DetailsPanelModel),

    render({model}) {
        const {testObj} = model;

        return panel({
            title: 'Recall Details',
            items: [testPanel({testObj})]
        });
    }
});
