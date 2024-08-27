import {vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {detailsPanel} from './detail/DetailsPanel';
import {RecallsPanelModel} from './RecallsPanelModel';

export const recallsPanel = hoistCmp.factory({
    model: creates(RecallsPanelModel),

    render({model}) {
        const {testObj} = model;

        return vframe(panel('mainPanel'), detailsPanel({testObj}));
    }
});
