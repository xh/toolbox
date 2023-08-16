import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {sampleGrid, wrapper} from '../../common';

export const standardGridPanel = hoistCmp.factory(() =>
    wrapper({
        description: [
            <p>
                Grids are at the heart of many Hoist React projects, and Grid, GridModel, and
                related helper components are key elements of the framework.
            </p>,
            <p>
                We rely on{' '}
                <a
                    href="https://www.ag-grid.com/javascript-grid-reference-overview/"
                    target="_blank"
                >
                    ag-Grid
                </a>{' '}
                to provide the core component, with Hoist layering on a normalized API as well as
                custom integrations for observable row selection, data stores, sorting, filtering, a
                custom column selection UI, server-side exports, enhanced column definitions,
                absolute value sorting, and more.
            </p>
        ],
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/grids/StandardGridPanel.tsx',
                notes: 'This example.'
            },
            {url: '$HR/cmp/grid/Grid.ts', notes: 'Hoist component.'},
            {
                url: '$HR/cmp/grid/GridModel.ts',
                notes: 'Hoist model for configuring and interacting with Grids.'
            },
            {
                url: '$HR/cmp/grid/impl/GridPersistenceModel.ts',
                notes: 'Hoist model for persisting Grid state to local storage.'
            },
            {url: '$HR/cmp/grid/columns/Column.ts', notes: 'Hoist class for Column config.'},
            {
                url: '$HR/data',
                text: 'Data package',
                notes: 'Hoist-managed data classes, including Store and StoreRecord.'
            },
            {
                url: 'https://www.ag-grid.com/javascript-grid-reference-overview/',
                text: 'ag-Grid Docs',
                notes: 'API documentation and guides for the underlying ag-grid library.'
            }
        ],
        item: panel({
            title: 'Grids › Standard',
            icon: Icon.gridPanel(),
            className: 'tb-grid-wrapper-panel',
            item: sampleGrid()
        })
    })
);
