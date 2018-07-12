/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, hbox, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {resizable} from '@xh/hoist/desktop/cmp/resizable';
import {wrapperPanel} from '../impl/WrapperPanel';

@HoistComponent()
export class ResizableContainerPanel extends Component {
    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-resizablecontainer-panel',
                title: 'Resizable Container',
                width: 500,
                height: 400,
                items: this.renderExample()
            })
        );
    }

    renderExample() {
        return vbox({
            cls: 'xh-toolbox-example-container',
            flex: 1,
            items: [
                hbox({
                    flex: 1,
                    items: [
                        resizable({
                            side: 'right',
                            contentSize: 125,
                            isOpen: true,
                            item: box('Collapsible Left')
                        }),
                        box('Main Content')
                    ]
                }),
                resizable({
                    side: 'top',
                    contentSize: 100,
                    isOpen: true,
                    item: box('Collapsible Bottom')
                })
            ]
        });
    }
}