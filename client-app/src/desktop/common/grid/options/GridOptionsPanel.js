import {GridModel} from '@xh/hoist/cmp/grid';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {gridOptions} from './GridOptions';

export const gridOptionsPanel = hoistCmp.factory({
    model: uses(GridModel),

    render({model, extraItems}) {
        return panel({
            title: 'Display Options',
            icon: Icon.settings(),
            className: 'tbox-display-opts',
            compactHeader: true,
            model: {side: 'right', defaultSize: 200, resizable: false},
            items: [
                gridOptions(),
                extraItems
            ]
        });
    }
});