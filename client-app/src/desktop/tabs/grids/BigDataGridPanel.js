/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import {wrapper} from '../../common';
import {sampleBigDataTreeGrid} from '../../common/SampleBigDataTreeGrid';

@HoistComponent
export class BigDataGridPanel extends Component {

    render() {
        return wrapper({
            description: [
                <p>
                    Example, showing large datasets in the Hoist Grid components
                </p>
            ],
            item: panel({
                title: 'Grids > Tree',
                icon: Icon.grid(),
                width: 1200,
                height: 800,
                item: sampleBigDataTreeGrid()
            })
        });
    }
}