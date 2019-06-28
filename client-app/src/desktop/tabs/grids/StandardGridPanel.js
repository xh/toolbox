import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import {wrapper, sampleGrid} from '../../common';

@HoistComponent
export class StandardGridPanel extends Component {

    render() {
        return wrapper({
            description: [
                <p>
                    Grids are at the heart of many Hoist React projects, and Grid, GridModel, and
                    related helper components are key elements of the framework.
                </p>,
                <p>
                    We rely on <a href="https://www.ag-grid.com/javascript-grid-reference-overview/" target="_blank">
                    ag-Grid</a> to provide the core component, with Hoist layering on a normalized API as well
                    as custom integrations for observable row selection, data stores, sorting, filtering, a custom
                    column selection UI, server-side exports, enhanced column definitions, absolute value sorting,
                    and more.
                </p>
            ],
            item: panel({
                width: 700,
                height: 400,
                title: 'Grids › Standard',
                icon: Icon.gridPanel(),
                item: sampleGrid()
            })
        });
    }

}