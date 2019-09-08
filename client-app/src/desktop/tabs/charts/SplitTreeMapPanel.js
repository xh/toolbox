import {hoistCmp, localAndPublished} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hframe} from '@xh/hoist/cmp/layout';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {grid} from '@xh/hoist/cmp/grid';
import {splitTreeMap} from '@xh/hoist/desktop/cmp/treemap';

import {SplitTreeMapPanelModel} from './SplitTreeMapPanelModel';


export const SplitTreeMapPanel = hoistCmp({
    model: localAndPublished(SplitTreeMapPanelModel),

    render({model}) {
        const {loadModel, dimChooserModel, gridModel, splitTreeMapModel} = model;

        return panel({
            mask: loadModel,
            bbar: [dimensionChooser({model: dimChooserModel})],
            items: hframe(
                panel({
                    model: {defaultSize: 480, side: 'left'},
                    item: grid({model: gridModel})
                }),
                splitTreeMap({model: splitTreeMapModel})
            )
        });
    }
});