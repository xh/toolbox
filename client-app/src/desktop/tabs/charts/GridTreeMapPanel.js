import {hoistCmp, creates} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hframe} from '@xh/hoist/cmp/layout';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {grid} from '@xh/hoist/cmp/grid';
import {treeMap} from '@xh/hoist/desktop/cmp/treemap';

import {GridTreeMapModel} from './GridTreeMapModel';

export const GridTreeMapPanel = hoistCmp({
    model: creates(GridTreeMapModel),

    render({model}) {
        return panel({
            mask: model.loadModel,
            bbar: [dimensionChooser()],
            items: hframe(
                panel({
                    model: {defaultSize: 480, side: 'left'},
                    item: grid()
                }),
                treeMap({model: model.treeMapModel})
            )
        });
    }
});