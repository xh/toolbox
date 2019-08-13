/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
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
                    Hoist React grids support column grouping as described in
                    the <a href="https://www.ag-grid.com/javascript-grid-column-properties/#columns-and-column-groups" target="_blank">
                    ag-Grid documentation</a>.
                </p>,
                <p>
                    Note that column group configurations must be provided either a <code>headerName</code>
                    or <code>groupId</code> property, which must be unique within the GridModel. Column
                    groups in Hoist React are also 'sealed', meaning that columns may be reordered <em>within</em> the
                    group in which they are defined but not broken out from them.
                </p>,
                <p>
                    This grid also demonstrates persistent grid state using the browser's local storage.
                </p>
            ],
            item: panel({
                title: 'Grids › Grouped Columns',
                icon: Icon.gridPanel(),
                width: 900,
                height: 500,
                item: sampleColumnGroupsGrid()
            })
        });
    }

}