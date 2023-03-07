import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {standardGridPanel} from './StandardGridPanel';
import {columnGroupsGridPanel} from './ColumnGroupsGridPanel';
import {restGridPanel} from './RestGridPanel';
import {dataViewPanel} from './DataViewPanel';
import {treeGridPanel} from './TreeGridPanel';
import {treeGridWithCheckboxPanel} from './TreeGridWithCheckboxPanel';
import {agGridView} from './AgGridView';
import {inlineEditingPanel} from './InlineEditingPanel';
import {columnFilteringPanel} from './ColumnFilteringPanel';
import './GridsTab.scss';

export const gridsTab = hoistCmp.factory(() =>
    tabContainer({
        modelConfig: {
            route: 'default.grids',
            tabs: [
                {id: 'standard', content: standardGridPanel},
                {id: 'tree', content: treeGridPanel},
                {id: 'columnFiltering', content: columnFilteringPanel},
                {id: 'inlineEditing', content: inlineEditingPanel},
                {id: 'dataview', title: 'DataView', content: dataViewPanel},
                {
                    id: 'treeWithCheckBox',
                    title: 'Tree w/CheckBox',
                    content: treeGridWithCheckboxPanel
                },
                {id: 'groupedCols', title: 'Grouped Columns', content: columnGroupsGridPanel},
                {id: 'rest', title: 'REST Editor', content: restGridPanel},
                {id: 'agGrid', title: 'ag-Grid Wrapper', content: agGridView}
            ],
            switcher: {orientation: 'left'}
        },
        className: 'toolbox-tab'
    })
);
