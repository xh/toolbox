import {creates, hoistCmp} from '@xh/hoist/core';
import {hframe, filler} from '@xh/hoist/cmp/layout';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {button, colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';

import {ColumnFilteringPanelModel} from './ColumnFilteringPanelModel';
import {wrapper} from '../../common';
import {gridOptionsPanel} from '../../common/grid/options/GridOptionsPanel';

export const columnFilteringPanel = hoistCmp.factory({
    model: creates(ColumnFilteringPanelModel),
    render() {
        return wrapper({
            description: [
                <p>
                    Grids support column-based filtering. To enable, provide a <code>GridModel</code> with a
                    <code>GridFilterModel</code> via the <code>GridFilterModel.filterModel</code> config, and
                    <code>filterable: true</code> on the columns you wish you filter. For convenience, you can
                    pass <code>filterModel: true</code> to enable the default <code>GridFilterModel</code>, which
                    will include all fields in the <code>GridModel</code>'s <code>Store</code> and automatically
                    read / write filters to the <code>Store</code>.
                </p>,
                <p>
                    Alternatively, you can provide a configuration for a <code>GridFilterModel</code>. Configuration
                    options include <code>bind</code> (allowing you to read / write to a different <code>Store</code>
                    or Cube <code>View</code>) and <code>fieldSpecs</code> (allowing you to specify the behaviour of
                    specific fields, such as whether or not to enable the "Values" tab and pass props to the inputs
                    used on the "Custom" tab)
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/grids/ColumnFilteringPanel.js', notes: 'This example.'},
                {url: '$HR/cmp/grid/filter/GridFilterModel.js', notes: 'Hoist model for managed Grid filters.'},
                {url: '$HR/cmp/grid/filter/GridFilterFieldSpec.js', notes: 'FieldSpec for field managed by the GridFilterModel.'},
                {url: '$HR/cmp/filter/FilterChooserModel.js', notes: 'Hoist model for FilterChooser component.'},
                {url: '$HR/cmp/filter/FilterChooserFieldSpec.js', notes: 'FieldSpec for field managed by the FilterChooserModel.'}
            ],
            item: panel({
                title: 'Grids › Column Filtering',
                icon: Icon.filter(),
                className: 'tb-grid-wrapper-panel tb-column-filtering-panel',
                tbar: tbar(),
                item: hframe(
                    grid(),
                    gridOptionsPanel()
                ),
                bbar: bbar()
            })
        });
    }
});

const tbar = hoistCmp.factory(() => {
    return toolbar(
        filterChooser({flex: 1, enableClear: true}),
        storeFilterField()
    );
});

const bbar = hoistCmp.factory(({model}) => {
    return toolbar(
        button({
            icon: Icon.filter(),
            text: 'View Grid Filters',
            intent: 'primary',
            onClick: () => model.gridModel.filterModel.openDialog()
        }),
        filler(),
        gridCountLabel(),
        colChooserButton(),
        exportButton()
    );
});
