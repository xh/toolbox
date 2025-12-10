import {grid} from '@xh/hoist/cmp/grid';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {TickerSelectorModel} from './TickerSelectorModel';

export const tickerSelector = hoistCmp.factory({
    displayName: 'TickerSelector',
    model: uses(TickerSelectorModel),

    render({model, ...rest}) {
        return panel({
            title: 'Select Tickers',
            icon: Icon.checkSquare(),
            compactHeader: true,
            tbar: toolbar({
                compact: true,
                items: [storeFilterField({flex: 1})]
            }),
            item: grid(),
            ...rest
        });
    }
});
