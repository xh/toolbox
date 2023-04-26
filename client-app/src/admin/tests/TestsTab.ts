import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
// eslint-disable-next-line
import {asyncLoopPanel} from './asyncLoops/AsyncLoopPanel';
import {GridTestPanel} from './grids/GridTestPanel';
import {CubeTestPanel} from './cube/CubeTestPanel';
import {WebSocketTestPanel} from './websocket/WebSocketTestPanel';
import {LocalDateTestPanel} from './localDate/LocalDateTestPanel';
import {PanelResizingTestPanel} from './panels/PanelResizingTestPanel';
import {FetchApiTestPanel} from './fetch/FetchApiTestPanel';
import {SelectTestPanel} from './Select/SelectTestPanel';
import {dataViewTestPanel} from './dataview/DataViewTestPanel';
import {storeColumnFilterPanel} from './columnFilters/store/StoreColumnFilterPanel';
import {viewColumnFilterPanel} from './columnFilters/view/ViewColumnFilterPanel';
import {gridScrolling} from './gridScrolling/GridScrolling';

export const testsTab = hoistCmp.factory(() => {
    return tabContainer({
        modelConfig: {
            route: 'default.tests',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'asyncLoop', title: 'Async Loops', content: asyncLoopPanel},
                {id: 'cube', title: 'Cube Data', content: CubeTestPanel},
                {id: 'dataView', title: 'Data View', content: dataViewTestPanel},
                {id: 'fetchAPI', title: 'Fetch API', content: FetchApiTestPanel},
                {id: 'grid', title: 'Grid', content: GridTestPanel},
                {id: 'gridScrolling', title: 'Grid Scrolling', content: gridScrolling},
                {id: 'localDate', title: 'LocalDate API', content: LocalDateTestPanel},
                {id: 'panelResizing', title: 'Panel Resizing', content: PanelResizingTestPanel},
                {id: 'select', title: 'Select', content: SelectTestPanel},
                {id: 'webSockets', title: 'WebSockets', content: WebSocketTestPanel},
                {
                    id: 'storeColumnFilters',
                    title: 'Store Column Filters',
                    content: storeColumnFilterPanel
                },
                {
                    id: 'viewColumnFilters',
                    title: 'View Column Filters',
                    content: viewColumnFilterPanel
                }
            ]
        }
    });
});
