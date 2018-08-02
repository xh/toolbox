/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, hbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../impl/Wrapper';

@HoistComponent()
export class HBoxContainerPanel extends Component {
    render() {
        return wrapper({
            description: `
                An hbox lays out its children horizontally, rendering a box with flexDirection 
                set to row.
            `,
            item: panel({
                title: 'Containers > HBox',
                icon: Icon.box(),
                height: 400,
                width: 600,
                item: hbox({
                    itemSpec: {
                        factory: box,
                        padding: 10,
                        cls: 'toolbox-containers-box'
                    },
                    items: [
                        {flex: 1, item: 'flex: 1'},
                        {width: 100, item: 'width: 100'},
                        {flex: 2, item: 'flex: 2'}
                    ]
                })
            })
        });
    }

}