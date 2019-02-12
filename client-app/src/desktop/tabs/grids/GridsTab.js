import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/desktop/cmp/tab';

import {StandardGridPanel} from './StandardGridPanel';
import {ColumnGroupsGridPanel} from './ColumnGroupsGridPanel';
import {RestGridPanel} from './RestGridPanel';
import {DataViewPanel} from './DataViewPanel';
import {TreeGridPanel} from './TreeGridPanel';
import {TreeGridWithCheckboxPanel} from './TreeGridWithCheckboxPanel';
import {ColumnFilterGridPanel} from './ColumnFilterGridPanel';

@HoistComponent
export class GridsTab extends Component {

    render() {
        return tabContainer({
            model: {
                route: 'default.grids',
                tabs: [
                    {id: 'standard', content: StandardGridPanel},
                    {id: 'tree', content: TreeGridPanel},
                    {id: 'treeWithCheckBox', title: 'Tree w/CheckBox', content: TreeGridWithCheckboxPanel},
                    {id: 'groupedCols', title: 'Grouped Columns', content: ColumnGroupsGridPanel},
                    {id: 'rest', title: 'REST Editor', content: RestGridPanel},
                    {id: 'dataview', title: 'DataView', content: DataViewPanel}
                ]
            },
            switcherPosition: 'left',
            className: 'toolbox-tab'
        });
    }
}
