/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {div, vbox, box} from '@xh/hoist/cmp/layout';

@HoistComponent()
export class VBoxPage extends Component {

    render() {
        return page({
            cls: 'toolbox-containers-page',
            items: [
                div({
                    cls: 'toolbox-description',
                    item: `
                        A vbox lays out its children vertically, rendering a box with flexDirection 
                        set to column.
                    `
                }),
                vbox({
                    itemSpec: {
                        factory: box,
                        padding: 10,
                        cls: 'toolbox-containers-box'
                    },
                    items: [
                        {flex: 1, item: 'flex: 1'},
                        {height: 80, item: 'height: 80'},
                        {flex: 2, item: 'flex: 2'}
                    ]
                })
            ]
        });
    }

}

export const vBoxPage = elemFactory(VBoxPage);