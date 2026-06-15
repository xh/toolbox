import {creates, hoistCmp} from '@xh/hoist/core';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {
    sampleColumnGroupsGrid,
    SampleColumnGroupsGridModel,
    wrapper,
    wrapperOption
} from '../../common';

export const columnGroupsGridPanel = hoistCmp.factory({
    model: creates(SampleColumnGroupsGridModel),
    render({model}) {
        return wrapper({
            title: 'Grouped Columns',
            icon: Icon.gridPanel(),
            description: [
                'Hoist React grids support column grouping as described in the [AG Grid',
                'documentation](https://www.ag-grid.com/javascript-data-grid/column-groups/).',
                '',
                'Note that column group configurations must be provided either a `headerName` or',
                '`groupId` property, which must be unique within the `GridModel`. Column groups in',
                "Hoist React are also 'sealed', meaning that columns may be reordered *within* the",
                'group in which they are defined but not broken out from them.',
                '',
                'This grid also persists its state (column order, sizing, and visibility) to the',
                "browser's local storage."
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/ColumnGroupsGridPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Grid component guide and core concepts.'
                },
                {
                    url: '$HR/docs/persistence.md',
                    text: 'Persistence docs',
                    notes: 'Guide to persisting UI state such as grid layout.'
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
            options: wrapperOption({
                label: 'Sales in millions',
                control: switchInput({model, bind: 'inMillions'})
            }),
            item: panel({
                className: 'tb-grid-wrapper-panel',
                item: sampleColumnGroupsGrid()
            })
        });
    }
});
