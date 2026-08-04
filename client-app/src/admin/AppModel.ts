import {AppModel as HoistAdminAppModel} from '@xh/hoist/admin/AppModel';
import {TabConfig} from '@xh/hoist/cmp/tab';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {InitContext, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {PortfolioService} from '../core/svc/PortfolioService';
import {
    asyncLoopPanel,
    columnChooserTestPanel,
    storeColumnFilterPanel,
    viewColumnFilterPanel,
    CubeTestPanel,
    dataViewTestPanel,
    FetchApiTestPanel,
    GridTestPanel,
    gridScrolling,
    LocalDateTestPanel,
    PanelResizingTestPanel,
    SelectTestPanel,
    viewManagerTestPanel,
    WebSocketTestPanel
} from './tests';

export class AppModel extends HoistAdminAppModel {
    static instance: AppModel;

    /** Named parameter sets for the Grid test panel - see GridTestModel. */
    @managed gridTestViewManager: ViewManagerModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([PortfolioService], ctx);

        // Constructed here, in initAsync, so we can await the async factory and ensure that all
        // saved configs are loaded and the desired one preselected before GridTestModel binds its
        // settings to this model within its constructor.
        this.gridTestViewManager = await ViewManagerModel.createAsync(
            {
                type: 'gridTestConfig',
                typeDisplayName: 'config',
                // Benchmark configs should only change when explicitly saved - a silent auto-save
                // would quietly re-baseline a config mid-comparison.
                enableAutoSave: false,
                manageGlobal: XH.getUser().isHoistAdmin
            },
            ctx
        );
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
