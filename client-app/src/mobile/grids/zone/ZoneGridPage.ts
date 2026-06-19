import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {zoneGrid} from '@xh/hoist/cmp/zoneGrid';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {zoneMapperButton} from '@xh/hoist/mobile/cmp/button';
import {select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {exampleOption, exampleScreen} from '../../cmp/example/ExampleScreen';
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
            options: [
                exampleOption({
                    label: 'Sizing mode',
                    control: select({
                        width: 140,
                        model: gridModel,
                        bind: 'sizingMode',
                        options: [
                            {label: 'Tiny', value: 'tiny'},
                            {label: 'Compact', value: 'compact'},
                            {label: 'Standard', value: 'standard'},
                            {label: 'Large', value: 'large'}
                        ]
                    })
                }),
                exampleOption({
                    label: 'Row borders',
                    control: switchInput({model: gridModel, bind: 'rowBorders'})
                }),
                exampleOption({
                    label: 'Stripe rows',
                    control: switchInput({model: gridModel, bind: 'stripeRows'})
                })
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
