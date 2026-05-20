import {hoistCmp} from '@xh/hoist/core';
import {box, p, vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';

export const vboxContainerPanel = hoistCmp.factory(() =>
    wrapper({
        description: p(
            'A VBox lays out its children vertically, rendering a Box with flexDirection:column.'
        ),
        links: [
            {
                url: '$HR/cmp/layout/Box.ts',
                notes: 'Hoist Box components.'
            }
        ],
        item: panel({
            title: 'Layout › VBox',
            icon: Icon.box(),
            height: 400,
            width: 700,
            item: vbox({
                flex: 1,
                items: [
                    renderBox({flex: 1, item: 'flex: 1'}),
                    renderBox({height: 50, item: 'height: 50'}),
                    renderBox({flex: 2, item: 'flex: 2'})
                ]
            })
        })
    })
);

function renderBox(args) {
    return box({
        className: 'tb-layout-box',
        ...args
    });
}
