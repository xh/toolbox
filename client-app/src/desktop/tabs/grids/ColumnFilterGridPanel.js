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

import {wrapper, sampleColumnFilterGrid} from '../../common';

@HoistComponent
export class ColumnFilterGridPanel extends Component {

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist disables ag-Grid column filters by default, but supports their usage
                    via the <code>agOptions</code> prop for Column and Grid.
                </p>
            ],
            items: panel({
                title: 'Grids > Column Filters',
                icon: Icon.gridPanel(),
                width: 900,
                height: 400,
                item: sampleColumnFilterGrid()
            })
        });
    }

}