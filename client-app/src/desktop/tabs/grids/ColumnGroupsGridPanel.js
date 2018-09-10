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

import {wrapper, sampleColumnGroupsGrid} from '../../common';

@HoistComponent
export class ColumnGroupsGridPanel extends Component {

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist React grids support column grouping as described in the ag-grid
                    <a href="https://www.ag-grid.com/javascript-grid-column-properties/#columns-and-column-groups" target="_blank">
                    documentation</a> with a few important wrinkles. Column groups must be explicitly define with either
                    a unique headerName or groupId. Also column groups in Hoist React are 'sealed'. This means that
                    columns maybe reordered within the group in which they are defined but not broken out of them.
                </p>,
                <p>
                    This grid also demonstrates persistent grid state using the browser's local storage.
                </p>
            ],
            item: panel({
                title: 'Grids > Grouped Columns',
                icon: Icon.grid(),
                width: 990,
                height: 400,
                item: sampleColumnGroupsGrid()
            })
        });
    }

}