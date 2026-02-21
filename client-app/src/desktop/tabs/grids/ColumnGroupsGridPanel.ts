import {hoistCmp} from '@xh/hoist/core';
import {a, em, p} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {sampleColumnGroupsGrid, wrapper} from '../../common';

export const columnGroupsGridPanel = hoistCmp.factory(() =>
    wrapper({
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
                'Note that column group configurations must be provided either a headerName or groupId property, which must be unique within the GridModel. Column groups in Hoist React are also \'sealed\', meaning that columns may be reordered ',
                em('within'),
                ' the group in which they are defined but not broken out from them.'
            ),
            p(
                'This grid also demonstrates persistent grid state using the browser\'s local storage.'
            )
        ],
        item: panel({
            title: 'Grids › Grouped Columns',
            icon: Icon.gridPanel(),
            className: 'tb-grid-wrapper-panel',
            item: sampleColumnGroupsGrid()
        })
    })
);
