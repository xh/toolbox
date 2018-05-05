/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {hoistComponent} from 'hoist/core';
import {vframe, filler} from 'hoist/layout';
import {wrapperPanel} from '../impl/WrapperPanel';
import {toolbar, panel} from 'hoist/cmp';
import {button} from 'hoist/kit/blueprint';

@hoistComponent()
export class ToolbarPanel extends Component {
    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-toolbar-panel',
                title: 'Toolbar Component',
                width: 500,
                height: 400,
                item: this.renderExample()
            })
        );
    }

    renderExample() {
        return vframe({
            cls: 'xh-toolbox-example-container',
            items: [
                toolbar(
                    button('Left Aligned')
                ),
                toolbar({
                    vertical: true,
                    width: 60,
                    flex: 1,
                    items: [
                        filler(),
                        button('Mid'),
                        filler()
                    ]
                }),
                toolbar(
                    filler(),
                    button('Right Aligned')
                ),
            ]
        });
    }
}