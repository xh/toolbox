import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, hbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';

@HoistComponent
export class HBoxContainerPanel extends Component {
    render() {
        return wrapper({
            description: <p>
                An HBox lays out its children horizontally, rendering a Box
                with <code>flexDirection:row</code>.
            </p>,
            item: panel({
                title: 'Containers > HBox',
                icon: Icon.box(),
                height: 400,
                width: 700,
                item: hbox(
                    this.renderBox({flex: 1, item: 'flex: 1'}),
                    this.renderBox({width: 100, item: 'width: 100'}),
                    this.renderBox({flex: 2, item: 'flex: 2'})
                )
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