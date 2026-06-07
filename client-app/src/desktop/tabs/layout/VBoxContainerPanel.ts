import {hoistCmp} from '@xh/hoist/core';
import {box, vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';

export const vboxContainerPanel = hoistCmp.factory(() =>
    wrapper({
        title: 'VBox',
        icon: Icon.box(),
        description: [
            '`VBox` lays out its children in a vertical column. It is a thin wrapper over',
            '`Box` (`flexDirection: column`) that exposes flexbox and Hoist layout properties',
            'such as `flex`, `height`, `gap`, and `alignItems` directly as component props, as',
            'shown by the mix of flexed and fixed-height boxes below.'
        ],
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/layout/VBoxContainerPanel.ts',
                notes: 'This example.'
            },
            {
                url: '$HR/cmp/layout/README.md',
                text: 'Layout docs',
                notes: 'Layout containers guide.'
            },
            {url: '$HR/cmp/layout/Box.ts', notes: 'The Box component and its layout props.'}
        ],
        item: panel({
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
