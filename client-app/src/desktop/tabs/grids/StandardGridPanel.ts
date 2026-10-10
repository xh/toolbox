import {creates, hoistCmp} from '@xh/hoist/core';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {SampleGridModel} from '../../common/grid/SampleGridModel';
import {gridDisplayActions, gridDisplayOptions} from '../../common/grid/options/GridDisplayOptions';
import {sampleGrid} from '../../common/grid/SampleGrid';
import {wrapper, wrapperOption} from '../../common/Wrapper';

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
                'absolute value sorting, and more.',
                '',
                'The Volume, P&L and Date columns set a `Column.formatter`, so ag-Grid writes',
                'their text into plain cells. Switch Cell Formatting to compare them with',
                'renderers.'
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
                    url: '$TB/client-app/src/core/columns/Trades.ts',
                    notes: 'Trade column specs, with their formatters and matching renderers.'
                },
                {
                    url: '$HR/cmp/grid/README.md#formatters',
                    text: 'Formatter docs',
                    notes: 'Column.formatter vs. renderer, and when to use each.'
                },
                {
                    url: '$HR/format/README.md#formatter-factories',
                    text: 'Formatter factories',
                    notes: 'numberFormatter, dateFormatter and friends, and the options they take.'
                },
                {
                    url: '$HR/data',
                    text: 'Data package',
                    notes: 'Hoist-managed data classes, including Store and StoreRecord.'
                },
                {
                    url: '$HR/cmp/grid/README.md#cell-corner-flags',
                    text: 'Cell flag docs',
                    notes: 'Config, precedence vs. validation, and the flag size CSS custom property.'
                },
                {
                    url: 'https://www.ag-grid.com/javascript-data-grid/',
                    text: 'AG Grid Docs',
                    notes: 'API documentation and guides for the underlying AG Grid library.'
                }
            ],
            options: [
                ...gridDisplayOptions(gridModel),
                wrapperOption({
                    label: 'Cell Formatting',
                    propName: 'ColumnSpec.formatter',
                    control: segmentedControl({
                        model,
                        bind: 'cellFormatting',
                        compact: true,
                        options: [
                            {value: 'formatter', label: 'Formatter'},
                            {value: 'renderer', label: 'Renderer'}
                        ]
                    }),
                    info:
                        'Formatter writes Volume, P&L and Date as plain text. Renderer mounts a ' +
                        'React component per cell. The output should look identical.'
                }),
                ...gridDisplayActions(gridModel)
            ],
            item: panel({
                className: 'tb-grid-wrapper-panel',
                item: sampleGrid()
            })
        });
    }
});
