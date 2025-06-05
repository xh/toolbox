import {AppModel as HoistAdminAppModel} from '@xh/hoist/admin/AppModel';
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
    override getNavigationManagerConfiguration() {
        return [
            ...super.getNavigationManagerConfiguration(),
            {
                id: 'roadmap',
                icon: Icon.mapSigns(),
                children: [
                    {
                        id: 'projects',
                        icon: Icon.checkCircle(),
                        content: projectRestPanel
                    },
                    {id: 'phases', icon: Icon.calendar(), content: phaseRestPanel}
                ]
            },
            {
                id: 'tests',
                icon: Icon.stopwatch(),
                children: [
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
        ];
    }
}
