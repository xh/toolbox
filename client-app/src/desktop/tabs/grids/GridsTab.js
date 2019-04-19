import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {StandardGridPanel} from './StandardGridPanel';
import {ColumnGroupsGridPanel} from './ColumnGroupsGridPanel';
import {RestGridPanel} from './RestGridPanel';
import {DataViewPanel} from './DataViewPanel';
import {TreeGridPanel} from './TreeGridPanel';
import {TreeGridWithCheckboxPanel} from './TreeGridWithCheckboxPanel';
import {GridTestPanel} from './GridTestPanel';
import {AgGridView} from './AgGridView';

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
                    {id: 'dataview', title: 'DataView', content: DataViewPanel},
                    {id: 'agGrid', title: 'ag-Grid Wrapper', content: AgGridView},
                    {id: 'performance', title: 'Performance Test', content: GridTestPanel}
                ],
                switcherPosition: 'left'
            },
            className: 'toolbox-tab'
        });
    }
}
