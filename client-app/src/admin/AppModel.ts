import {AppModel as HoistAdminAppModel} from '@xh/hoist/admin/AppModel';
import {TabConfig} from '@xh/hoist/cmp/tab';
import {XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {PortfolioService} from '../core/svc/PortfolioService';
import {phaseRestPanel, projectRestPanel} from './roadmap';
import {
    asyncLoopPanel,
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

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(PortfolioService);
        XH.fetchService.autoGenCorrelationIds = true;
    }

    //------------------------
    // Overrides
    //------------------------
    override getTabRoutes() {
        return [
            ...super.getTabRoutes(),
            {
                name: 'roadmap',
                path: '/roadmap',
                children: [
                    {name: 'projects', path: '/projects'},
                    {name: 'phases', path: '/phases'}
                ]
            },
            {
                name: 'tests',
                path: '/tests',
                children: [
                    {name: 'asyncLoop', path: '/asyncLoop'},
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
        return [
            ...super.createTabs(),
            {
                id: 'roadmap',
                title: 'Roadmap',
                icon: Icon.mapSigns(),
                subTabContainer: {
                    tabs: [
                        {id: 'projects', icon: Icon.checkCircle(), content: projectRestPanel},
                        {id: 'phases', icon: Icon.calendar(), content: phaseRestPanel}
                    ],
                    switcher: {orientation: 'left'}
                }
            },
            {
                id: 'tests',
                icon: Icon.stopwatch(),
                subTabContainer: {
                    switcher: {orientation: 'left'},
                    tabs: [
                        {id: 'asyncLoop', title: 'Async Loops', content: asyncLoopPanel},
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
