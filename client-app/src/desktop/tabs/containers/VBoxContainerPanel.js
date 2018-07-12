/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapperPanel} from '../impl/WrapperPanel';
import './BoxContainer.scss';

@HoistComponent()
export class VBoxContainerPanel extends Component {
    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-vboxcontainer-panel',
                title: 'VBox Container',
                width: 500,
                height: '80%',
                item: this.renderExample()
            })
        );
    }

    renderExample() {
        return vbox({
            cls: 'xh-toolbox-example-container',
            flex: 1,
            items: [
                box({
                    flex: 1,
                    item: 'flex: 1'
                }),
                box({
                    height: 50,
                    item: 'height: 50'
                }),
                box({
                    flex: 2,
                    item: 'flex: 2'
                })]
        });
    }
}