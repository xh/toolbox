import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {asyncLoopPanel} from './asyncLoops/AsyncLoopPanel';
import {GridTestPanel} from './grids/GridTestPanel';
import {CubeTestPanel} from './cube/CubeTestPanel';
import {WebSocketTestPanel} from './websocket/WebSocketTestPanel';
import {LocalDateTestPanel} from './localDate/LocalDateTestPanel';
import {PanelResizingTestPanel} from './panels/PanelResizingTestPanel';
import {FetchApiTestPanel} from './fetch/FetchApiTestPanel';
import {SelectTestPanel} from './Select/SelectTestPanel';
import {dataViewTestPanel} from './dataview/DataViewTestPanel';
import {ColumnFilterPanel} from './columnFilters/ColumnFilterPanel';

export const testsTab = hoistCmp(() => {
    return tabContainer({
        model: {
            route: 'default.tests',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'asyncLoop', title: 'Async Loops', content: asyncLoopPanel},
                {id: 'cube', title: 'Cube Data', content: CubeTestPanel},
                {id: 'dataView', title: 'Data View', content: dataViewTestPanel},
                {id: 'fetchAPI', title: 'Fetch API', content: FetchApiTestPanel},
                {id: 'grid', title: 'Grid', content: GridTestPanel},
                {id: 'localDate', title: 'LocalDate API', content: LocalDateTestPanel},
                {id: 'panelResizing', title: 'Panel Resizing', content: PanelResizingTestPanel},
                {id: 'select', title: 'Select', content: SelectTestPanel},
                {id: 'webSockets', title: 'WebSockets', content: WebSocketTestPanel},
                {id: 'columnFilters', title: 'Column Filters', content: ColumnFilterPanel}
            ]
        }
    });
});