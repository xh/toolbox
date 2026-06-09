import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {
    gridDisplayActions,
    gridDisplayOptions,
    sampleGrid,
    SampleGridModel,
    wrapper
} from '../../common';

export const standardGridPanel = hoistCmp.factory({
    model: creates(SampleGridModel),
    render({model}) {
        const {gridModel} = model;
        return wrapper({
            title: 'Standard Grid',
            icon: Icon.gridPanel(),
            description: [
                'Grids are at the heart of many Hoist React projects, and `Grid`, `GridModel`, and',
                'related helper components are key elements of the framework.',
                '',
                'We rely on [AG Grid](https://www.ag-grid.com/javascript-data-grid/) to provide',
                'the core component, with Hoist layering on a normalized API as well as custom',
                'integrations for observable row selection, data stores, sorting, filtering, a',
                'custom column selection UI, server-side exports, enhanced column definitions,',
                'absolute value sorting, and more.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/StandardGridPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Grid component guide and core concepts.'
                },
                {url: '$HR/cmp/grid/Grid.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/grid/GridModel.ts',
                    notes: 'Hoist model for configuring and interacting with grids, including persistence.'
                },
                {url: '$HR/cmp/grid/columns/Column.ts', notes: 'Hoist class for Column config.'},
                {
                    url: '$HR/data',
                    text: 'Data package',
                    notes: 'Hoist-managed data classes, including Store and StoreRecord.'
                },
                {
                    url: 'https://www.ag-grid.com/javascript-data-grid/',
                    text: 'AG Grid Docs',
                    notes: 'API documentation and guides for the underlying AG Grid library.'
                }
            ],
            options: [...gridDisplayOptions(gridModel), ...gridDisplayActions(gridModel)],
            item: panel({
                className: 'tb-grid-wrapper-panel',
                item: sampleGrid()
            })
        });
    }
});
