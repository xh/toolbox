/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, hbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {resizable} from '@xh/hoist/desktop/cmp/resizable';
import {wrapper} from '../../common/Wrapper';

@HoistComponent()
export class ResizableContainerPanel extends Component {
    render() {
        return wrapper({
            description: `
                A resizable provides support for collapsing and drag-and-drop resizing of its 
                child components, including support for saving user state in a preference.
            `,
            item: panel({
                title: 'Containers > Resizable',
                height: 400,
                width: 700,
                items: [
                    hbox({
                        flex: 1,
                        items: [
                            resizable({
                                side: 'right',
                                contentSize: 125,
                                isOpen: true,
                                item: box({
                                    padding: 10,
                                    item: 'Collapsible Left'
                                })
                            }),
                            box({
                                padding: 10,
                                item: 'Main Content Area'
                            })
                        ]
                    }),
                    resizable({
                        side: 'top',
                        contentSize: 100,
                        isOpen: true,
                        item: box({
                            padding: 10,
                            item: 'Collapsible Bottom'
                        })
                    })
                ]
            })
        });
    }
}