import {hoistCmp} from '@xh/hoist/core';
import {box, hbox, p} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';

export const hboxContainerPanel = hoistCmp.factory(() =>
    wrapper({
        title: 'HBox',
        icon: Icon.box(),
        description: p(
            'HBox lays out its children in a horizontal row. It is a thin wrapper over Box (flexDirection: row) that exposes flexbox and Hoist layout properties such as flex, width, gap, and alignItems directly as component props, as shown by the mix of flexed and fixed-width boxes below.'
        ),
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/layout/HBoxContainerPanel.ts',
                notes: 'This example.'
            },
            {url: '$HR/cmp/layout/Box.ts', notes: 'The Box component and its layout props.'}
        ],
        item: panel({
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
