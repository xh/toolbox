import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {zoneGrid} from '@xh/hoist/cmp/zoneGrid';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {zoneMapperButton} from '@xh/hoist/mobile/cmp/button';
import {exampleScreen} from '../../cmp/example/ExampleScreen';
import {ZoneGridPageModel} from './ZoneGridPageModel';

export const zoneGridPage = hoistCmp.factory({
    model: creates(ZoneGridPageModel),
    render({model}) {
        const {zoneGridModel} = model,
            {gridModel} = zoneGridModel;

        return exampleScreen({
            title: 'Zone Grids',
            icon: Icon.gridLarge(),
            description: [
                '`ZoneGrid` leverages an underlying `Grid` to render multi-line, full-width rows -',
                'mapping fields into top/bottom and left/right zones. Tap the mapper above the grid to',
                'remap which fields appear in each zone.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/mobile/grids/zone/ZoneGridPage.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/zoneGrid/README.md', text: 'ZoneGrid docs', notes: 'Zones & mapping'}
            ],
            item: panel({
                mask: 'onLoad',
                tbar: [storeFilterField({gridModel}), filler(), zoneMapperButton()],
                item: zoneGrid()
            })
        });
    }
});
