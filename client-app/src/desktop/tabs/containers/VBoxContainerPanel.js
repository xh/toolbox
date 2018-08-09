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
                    flex: 1,
                    items: [
                        this.renderBox({flex: 1, item: 'flex: 1'}),
                        this.renderBox({height: 50, item: 'height: 50'}),
                        this.renderBox({flex: 2, item: 'flex: 2'})
                    ]
                })
            })
        });
    }

    renderBox(args) {
        return box({
            className: 'toolbox-containers-box',
            ...args
        });
    }
}