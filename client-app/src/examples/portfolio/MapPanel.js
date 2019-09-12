import {hoistCmpFactory, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {splitTreeMap} from '@xh/hoist/desktop/cmp/treemap';

import {MapPanelModel} from './MapPanelModel';

export const mapPanel = hoistCmpFactory({
    model: uses(MapPanelModel),

    render({model}) {
        const {splitTreeMapModel, panelSizingModel, loadModel} = model;

        return panel({
            title: panelSizingModel.collapsed ? 'Treemap' : null,
            mask: loadModel,
            model: panelSizingModel,
            item: splitTreeMap({
                model: splitTreeMapModel
            })
        });
    }
});

