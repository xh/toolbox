/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

@HoistComponent
export class WipTab extends Component {

    render() {
        const tabs = [];

        if (tabs.length) {
            return tabContainer({
                model: {
                    route: 'default.wip',
                    switcherPosition: 'left',
                    tabs
                }
            });
        } else {
            return panel(
                box({
                    margin: 20,
                    item: 'No WIP examples at the moment...'
                })
            );
        }
    }

}