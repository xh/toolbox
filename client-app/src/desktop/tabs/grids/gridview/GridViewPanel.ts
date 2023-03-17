import {grid} from '@xh/hoist/cmp/grid';
import {p} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../../common';
import {GridViewModel} from './GridViewModel';
import {gridViewManager} from './manager/GridViewManager';

export const gridViewPanel = hoistCmp.factory({
    model: creates(GridViewModel),

    render({model}) {
        return wrapper({
            description: [
                p(
                    'This example demonstrates a custom component and matching back-end support for persisting named grid views.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/gridview/GridViewPanel.tsx',
                    notes: 'This example.'
                }
            ],
            item: panel({
                title: 'Grids › GridView',
                icon: Icon.gridPanel(),
                className: 'tb-grid-wrapper-panel',
                tbar: [gridViewManager(), '-', filterChooser({flex: 1})],
                item: grid()
            })
        });
    }
});
