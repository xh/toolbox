import {loadAllAsync, managed, XH} from '@xh/hoist/core';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/mobile/cmp/appOption';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {BaseAppModel} from '../BaseAppModel';
import {PortfolioService} from '../core/svc/PortfolioService';
import {buttonPage} from './buttons/ButtonPage';
import {chartPage} from './charts/ChartPage';
import {treeMapPage} from './treemap/TreeMapPage';
import {containersPage} from './containers/ContainersPage';
import {dataViewPage} from './dataview/DataViewPage';
import {formPage} from './form/FormPage';
import {gridDetailPage} from './grids/GridDetailPage';
import {gridPage} from './grids/GridPage';
import {treeGridDetailPage} from './grids/tree/TreeGridDetailPage';
import {treeGridPage} from './grids/tree/TreeGridPage';
import {zoneGridPage} from './grids/zone/ZoneGridPage';
import {homePage} from './home/HomePage';
import {iconPage} from './icons/IconPage';
import {panelsPage} from './panels/PanelsPage';
import {pinPadPage} from './pinPad/PinPadPage';
import {popoverPage} from './popover/PopoverPage';
import {popupsPage} from './popups/PopupsPage';

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
            {id: 'treeMap', content: treeMapPage},
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
                        name: 'treeMap',
                        path: '/treeMap'
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
        await super.initAsync();
        await XH.installServicesAsync(PortfolioService);
    }

    override async doLoadAsync(loadSpec) {
        await loadAllAsync([], loadSpec);
    }
}
