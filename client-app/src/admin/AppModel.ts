import {AppModel as HoistAdminAppModel} from '@xh/hoist/admin/AppModel';
import type {TabConfig} from '@xh/hoist/cmp/tab';
import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {PortfolioService} from '../core/svc/PortfolioService';
import {viewManagers} from './viewManagers';
import {CubeTestPanel} from './tests/cube/CubeTestPanel';
import {FetchApiTestPanel} from './tests/fetch/FetchApiTestPanel';
import {GridTestPanel} from './tests/grids/GridTestPanel';
import {LocalDateTestPanel} from './tests/localDate/LocalDateTestPanel';
import {PanelResizingTestPanel} from './tests/panels/PanelResizingTestPanel';
import {SelectTestPanel} from './tests/select/SelectTestPanel';
import {WebSocketTestPanel} from './tests/websocket/WebSocketTestPanel';
import {asyncLoopPanel} from './tests/asyncLoops/AsyncLoopPanel';
import {columnChooserTestPanel} from './tests/columnChooser/ColumnChooserTestPanel';
import {dataViewTestPanel} from './tests/dataview/DataViewTestPanel';
import {gridScrolling} from './tests/gridScrolling/GridScrolling';
import {storeColumnFilterPanel} from './tests/columnFilters/store/StoreColumnFilterPanel';
import {viewColumnFilterPanel} from './tests/columnFilters/view/ViewColumnFilterPanel';
import {viewManagerTestPanel} from './tests/viewmanager/ViewManagerTestPanel';

export class AppModel extends HoistAdminAppModel {
    static instance: AppModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([PortfolioService], ctx);

        // Awaited here, in initAsync, so that all saved configs are loaded and the desired one
        // preselected before GridTestModel binds its settings within its constructor.
        await viewManagers.initAsync(ctx);
    }

    //------------------------
    // Overrides
    //------------------------
    override getTabRoutes() {
        return [
            ...super.getTabRoutes(),
            {
                name: 'tests',
                path: '/tests',
                children: [
                    {name: 'asyncLoop', path: '/asyncLoop'},
                    {name: 'columnChooser', path: '/columnChooser'},
                    {name: 'cube', path: '/cube'},
                    {name: 'dataView', path: '/dataView'},
                    {name: 'fetchAPI', path: '/fetchAPI'},
                    {name: 'grid', path: '/grid'},
                    {name: 'gridScrolling', path: '/gridScrolling'},
                    {name: 'localDate', path: '/localDate'},
                    {name: 'panelResizing', path: '/panelResizing'},
                    {name: 'select', path: '/select'},
                    {name: 'storeColumnFilters', path: '/storeColumnFilters'},
                    {name: 'viewColumnFilters', path: '/viewColumnFilters'},
                    {name: 'viewManager', path: '/viewManager'},
                    {name: 'webSockets', path: '/webSockets'}
                ]
            }
        ];
    }

    override createTabs() {
        const switcher = {mode: 'static'};
        return [
            ...super.createTabs(),
            {
                id: 'tests',
                icon: Icon.stopwatch(),
                content: {
                    switcher,
                    tabs: [
                        {id: 'asyncLoop', title: 'Async Loops', content: asyncLoopPanel},
                        {
                            id: 'columnChooser',
                            title: 'Column Chooser',
                            content: columnChooserTestPanel
                        },
                        {id: 'cube', title: 'Cube Data', content: CubeTestPanel},
                        {id: 'dataView', content: dataViewTestPanel},
                        {id: 'fetchAPI', title: 'Fetch API', content: FetchApiTestPanel},
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
            }
        ] as TabConfig[];
    }
}
