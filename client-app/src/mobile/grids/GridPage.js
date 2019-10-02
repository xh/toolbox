import {XH, hoistCmp, creates} from '@xh/hoist/core';

import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {label, switchInput} from '@xh/hoist/mobile/cmp/input';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';

import {GridPageModel} from './GridPageModel';

export const GridPage = hoistCmp({

    model: creates(GridPageModel),

    render({model}) {
        const {gridModel} = model;
        return page({
            title: 'Grids',
            icon: Icon.gridPanel(),
            mask: 'onLoad',
            item: grid({
                onRowClicked: (e) => {
                    const {id} = e.data.raw;
                    XH.appendRoute('gridDetail', {id});
                }
            }),
            tbar: [
                label('Compact:'),
                switchInput({
                    model: gridModel,
                    bind: 'compact'
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
                relativeTimestamp({
                    bind: 'dateLoaded',
                    options: {prefix: 'Loaded'}
                }),
                filler(),
                colChooserButton()
            ]
        });
    }
});