import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {splitTreeMap} from '@xh/hoist/cmp/treemap';
import {PositionsMapModel} from './PositionsMapModel';

export const positionsMap = hoistCmp.factory({
    model: uses(PositionsMapModel),

    render({model}) {
        return panel({
            item: splitTreeMap()
        });
    }
});
