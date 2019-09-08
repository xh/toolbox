import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {box, vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';

export const VBoxContainerPanel = hoistCmp(
    () => wrapper({
        description: <p>
            A VBox lays out its children vertically, rendering a Box
            with <code>flexDirection:column</code>.
        </p>,
        links: [
            {
                url: '$HR/cmp/layout/Box.js',
                notes: 'Hoist Box components.'
            },
            {
                url: '$HR/core/mixins/LayoutSupport.js',
                notes: 'Decorator to support core layout props.'
            }
        ],
        item: panel({
            title: 'Containers › VBox',
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
        className: 'toolbox-containers-box',
        ...args
    });
}