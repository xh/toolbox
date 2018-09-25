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

import {wrapper, sampleTreeGrid} from '../../common';

@HoistComponent
export class TreeGridPanel extends Component {

    render() {
        return wrapper({
            description: [
                <p>
                    The standard hoist grid component supports the display of hierarchical data in Tree form, using the
                    underly ag-Grid support.
                </p>,
                <p>
                    Applications need to simply provide standard record data with children nodes containing their
                    sub-records.  Data aggregations may be provided to the grid, or computed within the grid via standard
                    ag-Grid mechanisms.
                </p>
            ],
            item: panel({
                title: 'Grids > Tree',
                icon: Icon.grid(),
                width: 700,
                height: 400,
                item: sampleTreeGrid()
            })
        });
    }
}