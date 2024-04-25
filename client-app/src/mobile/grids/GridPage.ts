import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {colAutosizeButton, colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {label, select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
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
                    options: {prefix: 'Loaded'}
                })
            ],
            item: grid(),
            tbar: [
                label('Size:'),
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
                label('Borders:'),
                switchInput({
                    model: gridModel,
                    bind: 'rowBorders'
                }),
                label('Stripes:'),
                switchInput({
                    model: gridModel,
                    bind: 'stripeRows'
                })
            ],
            bbar: [storeFilterField(), filler(), colAutosizeButton(), colChooserButton()]
        });
    }
});
