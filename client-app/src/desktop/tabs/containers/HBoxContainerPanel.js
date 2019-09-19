import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {box, hbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';

export const HBoxContainerPanel = hoistCmp(
    () => wrapper({
        description: <p>
            An HBox lays out its children horizontally, rendering a Box
            with <code>flexDirection:row</code>.
        </p>,
        links: [
            {url: '$HR/cmp/layout/Box.js', notes: 'Hoist Box components.'},
            {url: '$HR/core/mixins/LayoutSupport.js', notes: 'Decorator to support core layout props.'}
        ],
        item: panel({
            title: 'Containers › HBox',
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
        className: 'toolbox-containers-box',
        ...args
    });
}