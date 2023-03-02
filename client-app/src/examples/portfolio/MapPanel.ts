import {hoistCmp, creates} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {splitTreeMap} from '@xh/hoist/desktop/cmp/treemap';
import {MapPanelModel} from './MapPanelModel';

export const mapPanel = hoistCmp.factory({
    model: creates(MapPanelModel),

    render({model}) {
        const {loadModel} = model;

        return panel({
            mask: loadModel,
            item: splitTreeMap()
        });
    }
});
