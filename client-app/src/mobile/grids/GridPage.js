import {XH, hoistCmp, creates} from '@xh/hoist/core';

import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {label, switchInput} from '@xh/hoist/mobile/cmp/input';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';

import {GridPageModel} from './GridPageModel';
import {select} from '@xh/hoist/desktop/cmp/input';

export const gridPage = hoistCmp.factory({

    model: creates(GridPageModel),

    render({model}) {
        const {gridModel} = model;
        return page({
            title: 'Grids',
            icon: Icon.gridPanel(),
            mask: 'onLoad',
            headerItems: [
                relativeTimestamp({
                    bind: 'dateLoaded',
                    options: {prefix: 'Loaded'}
                })
            ],
            item: grid({
                onRowClicked: (e) => {
                    const {id} = e.data.raw;
                    XH.appendRoute('gridDetail', {id});
                }
            }),
            tbar: [
                label('Size:'),
                select({
                    width: 120,
                    model: gridModel,
                    bind: 'sizingMode',
                    options: [
                        {label: 'Large', value: 'large'},
                        {label: 'Standard', value: 'standard'},
                        {label: 'Compact', value: 'compact'},
                        {label: 'Tiny', value: 'tiny'}
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
            bbar: [
                storeFilterField(),
                filler(),
                colChooserButton()
            ]
        });
    }
});
