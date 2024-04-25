import {XH, loadAllAsync, managed} from '@xh/hoist/core';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {
    themeAppOption,
    sizingModeAppOption,
    autoRefreshAppOption
} from '@xh/hoist/mobile/cmp/appOption';
import {PortfolioService} from '../core/svc/PortfolioService';
import {buttonPage} from './buttons/ButtonPage';
import {chartPage} from './charts/ChartPage';
import {containersPage} from './containers/ContainersPage';
import {dataViewPage} from './dataview/DataViewPage';
import {formPage} from './form/FormPage';
import {gridDetailPage} from './grids/GridDetailPage';
import {gridPage} from './grids/GridPage';
import {homePage} from './home/HomePage';
import {iconPage} from './icons/IconPage';
import {panelsPage} from './panels/PanelsPage';
import {pinPadPage} from './pinPad/PinPadPage';
import {popoverPage} from './popover/PopoverPage';
import {popupsPage} from './popups/PopupsPage';
import {treeGridDetailPage} from './treegrids/TreeGridDetailPage';
import {treeGridPage} from './treegrids/TreeGridPage';
import {zoneGridPage} from './zoneGrids/ZoneGridPage';
import {BaseAppModel} from '../BaseAppModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    @managed
    navigatorModel: NavigatorModel = new NavigatorModel({
        track: true,
        pages: [
            {id: 'default', content: homePage},
            {id: 'grids', content: gridPage},
            {id: 'gridDetail', content: gridDetailPage},
            {id: 'treegrids', content: treeGridPage},
            {id: 'treeGridDetail', content: treeGridDetailPage},
            {id: 'zoneGrid', content: zoneGridPage},
            {id: 'dataview', content: dataViewPage},
            {id: 'form', content: formPage},
            {id: 'charts', content: chartPage},
            {id: 'containers', content: containersPage},
            {id: 'panels', content: panelsPage},
            {id: 'popovers', content: popoverPage},
            {id: 'popups', content: popupsPage},
            {id: 'buttons', content: buttonPage},
            {id: 'icons', content: iconPage},
            {id: 'pinPad', content: pinPadPage}
        ]
    });

    override getRoutes() {
        return [
            {
                name: 'default',
                path: '/mobile',
                children: [
                    {
                        name: 'grids',
                        path: '/grids',
                        children: [
                            {
                                name: 'gridDetail',
                                path: '/:id<\\d+>'
                            }
                        ]
                    },
                    {
                        name: 'treegrids',
                        path: '/treegrids',
                        children: [
                            {
                                name: 'treeGridDetail',
                                path: '/:id'
                            }
                        ]
                    },
                    {
                        name: 'zoneGrid',
                        path: '/zoneGrid',
                        children: [
                            {
                                name: 'gridDetail',
                                path: '/:id<\\d+>'
                            }
                        ]
                    },
                    {
                        name: 'dataview',
                        path: '/dataview'
                    },
                    {
                        name: 'form',
                        path: '/form'
                    },
                    {
                        name: 'charts',
                        path: '/charts'
                    },
                    {
                        name: 'containers',
                        path: '/containers'
                    },
                    {
                        name: 'panels',
                        path: '/panels'
                    },
                    {
                        name: 'popovers',
                        path: '/popovers'
                    },
                    {
                        name: 'popups',
                        path: '/popups'
                    },
                    {
                        name: 'buttons',
                        path: '/buttons'
                    },
                    {
                        name: 'icons',
                        path: '/icons'
                    },
                    {
                        name: 'pinPad',
                        path: '/pinPad'
                    }
                ]
            }
        ];
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }

    override async initAsync() {
        await XH.installServicesAsync(PortfolioService);
    }

    override async doLoadAsync(loadSpec) {
        await loadAllAsync([], loadSpec);
    }
}
