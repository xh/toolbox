import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {agGridOptions} from './AgGridOptions';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';

export const agGridOptionsPanel = hoistCmp.factory({
    model: uses(AgGridModel),

    render({model}) {
        console.log(model);

        return panel({
            title: 'Display Options',
            icon: Icon.settings(),
            className: 'tbox-display-opts',
            compactHeader: true,
            model: {side: 'right', defaultSize: `60`, resizable: false},
            items: [
                agGridOptions()
            ]
        });
    }
});