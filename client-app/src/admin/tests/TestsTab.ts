import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {asyncLoopPanel} from './asyncLoops/AsyncLoopPanel';
import {storeColumnFilterPanel} from './columnFilters/store/StoreColumnFilterPanel';
import {viewColumnFilterPanel} from './columnFilters/view/ViewColumnFilterPanel';
import {CubeTestPanel} from './cube/CubeTestPanel';
import {dataViewTestPanel} from './dataview/DataViewTestPanel';
import {FetchApiTestPanel} from './fetch/FetchApiTestPanel';
import {FormPersistenceTestPanel} from './formPersistance/FormPersistenceTestPanel';
import {GridTestPanel} from './grids/GridTestPanel';
import {gridScrolling} from './gridScrolling/GridScrolling';
import {LocalDateTestPanel} from './localDate/LocalDateTestPanel';
import {PanelResizingTestPanel} from './panels/PanelResizingTestPanel';
import {SelectTestPanel} from './select/SelectTestPanel';
import {viewManagerTestPanel} from './viewmanager/ViewManagerTestPanel';
import {WebSocketTestPanel} from './websocket/WebSocketTestPanel';

export const testsTab = hoistCmp.factory(() => {
    return tabContainer({
        modelConfig: {
            route: 'default.tests',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'asyncLoop', title: 'Async Loops', content: asyncLoopPanel},
                {id: 'cube', title: 'Cube Data', content: CubeTestPanel},
                {id: 'dataView', content: dataViewTestPanel},
                {id: 'fetchAPI', title: 'Fetch API', content: FetchApiTestPanel},
                {
                    id: 'formPersistence',
                    title: 'Form Persistence',
                    content: FormPersistenceTestPanel
                },
                {id: 'grid', title: 'Grid', content: GridTestPanel},
                {id: 'gridScrolling', content: gridScrolling},
                {id: 'localDate', title: 'LocalDate API', content: LocalDateTestPanel},
                {id: 'panelResizing', content: PanelResizingTestPanel},
                {id: 'select', content: SelectTestPanel},
                {id: 'storeColumnFilters', content: storeColumnFilterPanel},
                {id: 'viewColumnFilters', content: viewColumnFilterPanel},
                {id: 'viewManager', content: viewManagerTestPanel},
                {id: 'webSockets', title: 'WebSockets', content: WebSocketTestPanel}
            ]
        }
    });
});
