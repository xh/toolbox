import {hoistCmp} from '@xh/hoist/core';
import {box, hbox, p} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';

export const hboxContainerPanel = hoistCmp.factory(() =>
    wrapper({
        description: p(
            'An HBox lays out its children horizontally, rendering a Box with flexDirection:row.'
        ),
        links: [{url: '$HR/cmp/layout/Box.ts', notes: 'Hoist Box components.'}],
        item: panel({
            title: 'Layout › HBox',
            icon: Icon.box(),
            height: 400,
            width: 700,
            item: hbox(
                renderBox({flex: 1, item: 'flex: 1'}),
                renderBox({width: 100, item: 'width: 100'}),
                renderBox({flex: 2, item: 'flex: 2'})
            )
        })
    })
);

function renderBox(args) {
    return box({
        className: 'tb-layout-box',
        ...args
    });
}
