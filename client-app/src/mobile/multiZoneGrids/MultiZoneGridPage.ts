import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {multiZoneGrid} from '@xh/hoist/mobile/cmp/multiZoneGrid';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {multiZoneMapperButton} from '@xh/hoist/mobile/cmp/button';
import {MultiZoneGridPageModel} from './MultiZoneGridPageModel';

export const multiZoneGridPage = hoistCmp.factory({
    model: creates(MultiZoneGridPageModel),
    render({model}) {
        const {multiZoneGridModel} = model,
            {gridModel} = multiZoneGridModel;

        return panel({
            title: 'MultiZone Grids',
            icon: Icon.gridLarge(),
            mask: 'onLoad',
            headerItems: [
                relativeTimestamp({
                    bind: 'dateLoaded',
                    options: {prefix: 'Loaded'}
                })
            ],
            item: multiZoneGrid(),
            bbar: [storeFilterField({gridModel}), filler(), multiZoneMapperButton()]
        });
    }
});
