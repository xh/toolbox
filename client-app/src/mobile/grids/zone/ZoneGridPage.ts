import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {zoneGrid} from '@xh/hoist/cmp/zoneGrid';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {zoneMapperButton} from '@xh/hoist/mobile/cmp/button';
import {ZoneGridPageModel} from './ZoneGridPageModel';

export const zoneGridPage = hoistCmp.factory({
    model: creates(ZoneGridPageModel),
    render({model}) {
        const {zoneGridModel} = model,
            {gridModel} = zoneGridModel;

        return panel({
            title: 'Zone Grid',
            icon: Icon.gridLarge(),
            mask: 'onLoad',
            headerItems: [
                relativeTimestamp({
                    bind: 'dateLoaded',
                    options: {prefix: 'Loaded'}
                })
            ],
            tbar: [storeFilterField({gridModel}), filler(), zoneMapperButton()],
            item: zoneGrid()
        });
    }
});
