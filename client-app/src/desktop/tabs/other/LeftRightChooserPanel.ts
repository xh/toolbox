import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {wrapper, wrapperOption} from '../../common';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {
    leftRightChooser,
    leftRightChooserFilter,
    LeftRightChooserModel
} from '@xh/hoist/desktop/cmp/leftrightchooser';
import {select} from '@xh/hoist/desktop/cmp/input';
// @ts-ignore
import data from './impl/LeftRightChooserData';

export const leftRightChooserPanel = hoistCmp.factory({
    model: creates(() => LeftRightChooserPanelModel),

    render({model}) {
        return wrapper({
            title: 'LeftRightChooser',
            icon: Icon.arrowsLeftRight(),
            description: [
                '`LeftRightChooser` splits a list of items into generic "left" and "right"',
                'sides, with controls for the user to move items between the two. This can be',
                'used to e.g. create a selected subset from a pool of items - see the grid',
                'column chooser for such an example.',
                '',
                'Items can provide optional descriptions and groups, and can be marked with',
                '`locked:true` to prevent them from being moved from one side to another.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/LeftRightChooserPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/leftrightchooser/LeftRightChooser.ts',
                    notes: 'Hoist component.'
                },
                {
                    url: '$HR/desktop/cmp/leftrightchooser/LeftRightChooserModel.ts',
                    notes: 'Hoist component model.'
                },
                {
                    url: '$HR/desktop/cmp/leftrightchooser/LeftRightChooserFilter.ts',
                    notes: 'Optional filter component.'
                }
            ],
            options: wrapperOption({
                label: 'Filter match mode',
                control: select({
                    model,
                    bind: 'matchMode',
                    width: 150,
                    enableFilter: false,
                    options: [
                        {label: 'Start', value: 'start'},
                        {label: 'Start of word', value: 'startWord'},
                        {label: 'Any', value: 'any'}
                    ]
                })
            }),
            item: panel({
                width: 700,
                height: 400,
                item: leftRightChooser({
                    flex: 1
                }),
                bbar: [
                    leftRightChooserFilter({
                        matchMode: model.matchMode
                    })
                ]
            })
        });
    }
});

class LeftRightChooserPanelModel extends HoistModel {
    @managed
    leftRightChooserModel = new LeftRightChooserModel({
        data,
        ungroupedName: 'Others',
        leftEmptyText: 'No more fruits to choose!',
        rightGroupingEnabled: false
    });

    @bindable
    matchMode: 'start' | 'startWord' | 'any' = 'startWord';

    constructor() {
        super();
        makeObservable(this);
    }
}
