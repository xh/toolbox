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

import {wrapper, sampleTreeWithCheckBoxGrid} from '../../common';

@HoistComponent
export class TreeGridWithCheckboxPanel extends Component {

    render() {
        return wrapper({
            description: [
                <p>
                    This example is a copy of the Tree sample, but adds a checkbox component to every node via the treeColumn's "innerRendererFramework" property.
                </p>
            ],
            item: panel({
                title: 'Grids > Tree w/CheckBox',
                icon: Icon.grid(),
                width: 700,
                height: 400,
                item: sampleTreeWithCheckBoxGrid()
            })
        });
    }
}