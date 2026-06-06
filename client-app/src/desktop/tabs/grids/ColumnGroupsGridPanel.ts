import {elementFactory, hoistCmp} from '@xh/hoist/core';
import {a, p} from '@xh/hoist/cmp/layout';

const em = elementFactory('em');
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {sampleColumnGroupsGrid, wrapper} from '../../common';

export const columnGroupsGridPanel = hoistCmp.factory(() =>
    wrapper({
        title: 'Grouped Columns',
        icon: Icon.gridPanel(),
        description: [
            p(
                'Hoist React grids support column grouping as described in the ',
                a({
                    href: 'https://www.ag-grid.com/javascript-grid-column-properties/#columns-and-column-groups',
                    target: '_blank',
                    item: 'ag-Grid documentation'
                }),
                '.'
            ),
            p(
                "Note that column group configurations must be provided either a headerName or groupId property, which must be unique within the GridModel. Column groups in Hoist React are also 'sealed', meaning that columns may be reordered ",
                em('within'),
                ' the group in which they are defined but not broken out from them.'
            ),
            p(
                "This grid also persists its state (column order, sizing, and visibility) to the browser's local storage."
            )
        ],
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/grids/ColumnGroupsGridPanel.ts',
                notes: 'This example.'
            },
            {
                url: '$HR/cmp/grid/columns/ColumnGroup.ts',
                notes: 'Config for grouping columns under a shared header.'
            },
            {
                url: '$HR/cmp/grid/columns/Column.ts',
                notes: 'Config for the individual columns within each group.'
            },
            {
                url: '$HR/cmp/grid/GridModel.ts',
                notes: 'Hoist model for configuring and interacting with grids, including persistence.'
            }
        ],
        item: panel({
            className: 'tb-grid-wrapper-panel',
            item: sampleColumnGroupsGrid()
        })
    })
);
