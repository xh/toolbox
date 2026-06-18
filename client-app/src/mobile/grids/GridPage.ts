import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {colAutosizeButton, colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {checkboxButton, select} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {GridPageModel} from './GridPageModel';

export const gridPage = hoistCmp.factory({
    model: creates(GridPageModel),

    render({model}) {
        const {gridModel} = model;
        return panel({
            title: 'Grids',
            icon: Icon.gridPanel(),
            mask: 'onLoad',
            headerItems: [
                relativeTimestamp({
                    bind: 'dateLoaded',
                    prefix: 'Loaded'
                })
            ],
            tbar: [storeFilterField(), filler(), colAutosizeButton(), colChooserButton()],
            item: grid(),
            bbar: [
                select({
                    width: 120,
                    model: gridModel,
                    bind: 'sizingMode',
                    options: [
                        {label: 'Tiny', value: 'tiny'},
                        {label: 'Compact', value: 'compact'},
                        {label: 'Standard', value: 'standard'},
                        {label: 'Large', value: 'large'}
                    ]
                }),
                filler(),
                checkboxButton({
                    text: 'Borders',
                    model: gridModel,
                    bind: 'rowBorders'
                }),
                checkboxButton({
                    text: 'Stripes',
                    model: gridModel,
                    bind: 'stripeRows'
                })
            ]
        });
    }
});
