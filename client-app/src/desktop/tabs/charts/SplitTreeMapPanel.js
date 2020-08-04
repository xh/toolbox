import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hframe} from '@xh/hoist/cmp/layout';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {grid} from '@xh/hoist/cmp/grid';
import {splitTreeMap} from '@xh/hoist/desktop/cmp/treemap';
import {SplitTreeMapPanelModel} from './SplitTreeMapPanelModel';

export const splitTreeMapPanel = hoistCmp.factory({
    model: creates(SplitTreeMapPanelModel),

    render() {
        return panel({
            mask: 'onLoad',
            tbar: [dimensionChooser()],
            items: hframe(
                panel({
                    model: {defaultSize: 480, side: 'left'},
                    item: grid()
                }),
                splitTreeMap()
            )
        });
    }
});