import {GridModel} from '@xh/hoist/cmp/grid';
import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {gridOptions} from './GridOptions';

export const gridOptionsPanel = hoistCmp.factory<GridModel>({
    model: uses(GridModel),

    render({extraItems}) {
        return panel({
            title: 'Display Options',
            icon: Icon.settings(),
            className: 'tbox-display-opts',
            compactHeader: true,
            modelConfig: {side: 'right', defaultSize: 250, resizable: false},
            item: div({
                className: 'tbox-display-opts__inner',
                items: [gridOptions(), extraItems]
            })
        });
    }
});
