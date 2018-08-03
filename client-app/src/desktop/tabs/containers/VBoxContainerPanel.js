/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';

@HoistComponent()
export class VBoxContainerPanel extends Component {
    render() {
        return wrapper({
            description: <p>
                A VBox lays out its children vertically, rendering a Box
                with <code>flexDirection:column</code>.
            </p>,
            item: panel({
                title: 'Containers > VBox',
                icon: Icon.box(),
                height: 400,
                width: 700,
                item: vbox({
                    itemSpec: {
                        factory: box,
                        padding: 10,
                        height: 300,
                        cls: 'toolbox-containers-box'
                    },
                    items: [
                        {flex: 1, item: 'flex: 1'},
                        {height: 100, item: 'height: 100'},
                        {flex: 2, item: 'flex: 2'}
                    ]
                })
            })
        });
    }
}