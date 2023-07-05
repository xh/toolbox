import {creates, hoistCmp} from '@xh/hoist/core';
import {hframe} from '@xh/hoist/cmp/layout';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';

import {StoreColumnFilterPanelModel} from './StoreColumnFilterPanelModel';

export const storeColumnFilterPanel = hoistCmp.factory({
    model: creates(StoreColumnFilterPanelModel),
    render({model}) {
        return hframe(
            panel({
                mask: [
                    model.loadModel,
                    model.filterChooserModel.filterTask,
                    model.gridModel.filterTask
                ],
                icon: Icon.filter(),
                title: 'Column Filter Test Grid',
                tbar: tbar(),
                item: grid(),
                bbar: bbar()
            }),
            filterJsonPanel()
        );
    }
});

const tbar = hoistCmp.factory(() =>
    toolbar(
        filterChooser({
            flex: 1,
            enableClear: true
        })
    )
);

const bbar = hoistCmp.factory(() =>
    toolbar(
        gridCountLabel({
            includeChildren: true
        })
    )
);

const filterJsonPanel = hoistCmp.factory(() =>
    panel({
        modelConfig: {
            side: 'right',
            defaultSize: 500,
            collapsible: true
        },
        icon: Icon.code(),
        title: `Filter as JSON`,
        item: jsonInput({
            flex: 1,
            width: '100%',
            readonly: true,
            showCopyButton: true,
            bind: 'filterJson'
        })
    })
);
