import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {StandardGridPanel} from './StandardGridPanel';
import {ColumnGroupsGridPanel} from './ColumnGroupsGridPanel';
import {RestGridPanel} from './RestGridPanel';
import {DataViewPanel} from './DataViewPanel';
import {TreeGridPanel} from './TreeGridPanel';
import {TreeGridWithCheckboxPanel} from './TreeGridWithCheckboxPanel';

@HoistComponent
export class GridsTab extends Component {

    model = new TabContainerModel({
        route: 'default.grids',
        tabs: [
            {id: 'standard', content: StandardGridPanel},
            {id: 'tree', content: TreeGridPanel},
            {id: 'treeWithCheckBox', title: 'Tree w/CheckBox', content: TreeGridWithCheckboxPanel},
            {id: 'groupedCols', title: 'Grouped Columns', content: ColumnGroupsGridPanel},
            {id: 'rest', title: 'REST Editor', content: RestGridPanel},
            {id: 'dataview', title: 'DataView', content: DataViewPanel}
        ]
    });

    async loadAsync() {
        this.model.requestRefresh();
    }
    
    render() {
        return tabContainer({
            model: this.model,
            switcherPosition: 'left',
            className: 'toolbox-tab'
        });
    }
}
