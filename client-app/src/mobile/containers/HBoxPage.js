/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {div, hbox, box} from '@xh/hoist/cmp/layout';

@HoistComponent()
export class HBoxPage extends Component {

    render() {
        return page({
            className: 'toolbox-containers-page',
            items: [
                div({
                    className: 'toolbox-description',
                    item: `
                        An hbox lays out its children horizontally, rendering a box with flexDirection 
                        set to row.
                    `
                }),
                hbox({
                    itemSpec: {
                        factory: box,
                        padding: 10,
                        className: 'toolbox-containers-box'
                    },
                    items: [
                        {flex: 1, item: 'flex: 1'},
                        {width: 80, item: 'width: 80'},
                        {flex: 2, item: 'flex: 2'}
                    ]
                })
            ]
        });
    }

}

export const hBoxPage = elemFactory(HBoxPage);