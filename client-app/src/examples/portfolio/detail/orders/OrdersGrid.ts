import {grid} from '@xh/hoist/cmp/grid';
import {hoistCmp, uses} from '@xh/hoist/core';
import {colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {OrdersModel} from './OrdersModel';

export const ordersGrid = hoistCmp.factory({
    model: uses(OrdersModel),

    render({model}) {
        const {positionId, loadObserver} = model;

        return panel({
            item: grid(),
            bbar: [
                filterChooser({
                    placeholder: 'Filter orders...',
                    enableClear: true,
                    flex: 1
                }),
                '-',
                colChooserButton(),
                exportButton()
            ],
            mask: positionId == null || loadObserver.isPending
        });
    }
});
