import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {standardGridPanel} from './StandardGridPanel';
import {columnGroupsGridPanel} from './ColumnGroupsGridPanel';
import {restGridPanel} from './RestGridPanel';
import {dataViewPanel} from './DataViewPanel';
import {treeGridPanel} from './TreeGridPanel';
import {treeGridWithCheckboxPanel} from './TreeGridWithCheckboxPanel';
import {agGridView} from './AgGridView';
import './GridsTab.scss';

export const gridsTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.grids',
            tabs: [
                {id: 'standard', content: standardGridPanel},
                {id: 'tree', content: treeGridPanel},
                {id: 'treeWithCheckBox', title: 'Tree w/CheckBox', content: treeGridWithCheckboxPanel},
                {id: 'groupedCols', title: 'Grouped Columns', content: columnGroupsGridPanel},
                {id: 'rest', title: 'REST Editor', content: restGridPanel},
                {id: 'dataview', title: 'DataView', content: dataViewPanel},
                {id: 'agGrid', title: 'ag-Grid Wrapper', content: agGridView}
            ],
            switcherPosition: 'left'
        },
        className: 'toolbox-tab'
    })
);
