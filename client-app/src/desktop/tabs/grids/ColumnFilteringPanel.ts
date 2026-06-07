import {creates, hoistCmp} from '@xh/hoist/core';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {
    button,
    colAutosizeButton,
    colChooserButton,
    exportButton
} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {ColumnFilteringPanelModel} from './ColumnFilteringPanelModel';
import {wrapper, wrapperOption} from '../../common';

export const columnFilteringPanel = hoistCmp.factory({
    model: creates(ColumnFilteringPanelModel),
    render({model}) {
        const {filterModel} = model.gridModel;
        return wrapper({
            title: 'Column Filtering',
            icon: Icon.filter(),
            description: [
                'Grids support column-based filtering of their underlying store data. To',
                'enable, set the `GridModel.filterModel` config to a `GridFilterModel` (or',
                '`true` to create one with defaults) and set `filterable: true` on the columns',
                'you wish to filter.',
                '',
                'Applications may also wish to use a `FilterChooser` to allow the user to',
                'filter the store data via a single "omni-box" style text control.',
                '',
                'The example below shows both of these methods being used together on a single',
                'store.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/ColumnFilteringPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Grid component guide and core concepts.'
                },
                {
                    url: '$HR/cmp/grid/filter/GridFilterModel.ts',
                    notes: 'Hoist model for managed Grid filters.'
                },
                {
                    url: '$HR/cmp/grid/filter/GridFilterFieldSpec.ts',
                    notes: 'FieldSpec for field managed by the GridFilterModel.'
                },
                {
                    url: '$HR/cmp/filter/FilterChooserModel.ts',
                    notes: 'Hoist model for FilterChooser component.'
                },
                {
                    url: '$HR/cmp/filter/FilterChooserFieldSpec.ts',
                    notes: 'FieldSpec for field managed by the FilterChooserModel.'
                }
            ],
            // Generic grid display options omitted here (distracting in a filtering demo); only
            // this example's own filter controls are surfaced.
            options: [
                wrapperOption({
                    label: 'Commit on change',
                    control: switchInput({model: filterModel, bind: 'commitOnChange'})
                }),
                button({
                    icon: Icon.filter(),
                    text: 'View Grid Filters',
                    intent: 'primary',
                    width: '100%',
                    onClick: () => filterModel.openDialog()
                })
            ],
            item: panel({
                className: 'tb-grid-wrapper-panel tb-column-filtering-panel',
                tbar: tbar(),
                item: grid()
            })
        });
    }
});

const tbar = hoistCmp.factory(() =>
    toolbar(
        filterChooser({
            flex: 1,
            enableClear: true,
            placeholder: 'Filter with bound FilterChooser...'
        }),
        '-',
        gridCountLabel({unit: 'companies'}),
        '-',
        storeFilterField({placeholder: 'Quick filter...'}),
        '-',
        colAutosizeButton(),
        colChooserButton(),
        exportButton()
    )
);
