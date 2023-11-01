import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {zonedGrid} from '@xh/hoist/cmp/zonedGrid';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {zoneMapperButton} from '@xh/hoist/mobile/cmp/button';
import {ZonedGridPageModel} from './ZonedGridPageModel';

export const zonedGridPage = hoistCmp.factory({
    model: creates(ZonedGridPageModel),
    render({model}) {
        const {zonedGridModel} = model,
            {gridModel} = zonedGridModel;

        return panel({
            title: 'Zoned Grid',
            icon: Icon.gridLarge(),
            mask: 'onLoad',
            headerItems: [
                relativeTimestamp({
                    bind: 'dateLoaded',
                    options: {prefix: 'Loaded'}
                })
            ],
            item: zonedGrid(),
            bbar: [storeFilterField({gridModel}), filler(), zoneMapperButton()]
        });
    }
});
