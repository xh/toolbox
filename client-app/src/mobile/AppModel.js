import {HoistAppModel, loadAllAsync, managed, XH} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {OauthService} from '../core/svc/OauthService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {containersPage} from './containers/ContainersPage';
import {dataViewPage} from './dataview/DataViewPage';
import {formPage} from './form/FormPage';
import {chartPage} from './charts/ChartPage';
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

export class AppModel extends HoistAppModel {

    @managed
    navigatorModel = new NavigatorModel({
        track: true,
        pages: [
            {id: 'default', content: homePage},
            {id: 'grids', content: gridPage},
            {id: 'gridDetail', content: gridDetailPage},
            {id: 'treegrids', content: treeGridPage},
            {id: 'treeGridDetail', content: treeGridDetailPage},
            {id: 'dataview', content: dataViewPage},
            {id: 'form', content: formPage},
            {id: 'charts', content: chartPage},
            {id: 'containers', content: containersPage},
            {id: 'panels', content: panelsPage},
            {id: 'popovers', content: popoverPage},
            {id: 'popups', content: popupsPage},
            {id: 'icons', content: iconPage},
            {id: 'pinPad', content: pinPadPage}
        ]
    });

    getRoutes() {
        return [
            {
                name: 'default',
                path: '/mobile',
                children: [
                    {
                        name: 'grids',
                        path: '/grids',
                        children: [{
                            name: 'gridDetail',
                            path: '/:id<\\d+>'
                        }]
                    },
                    {
                        name: 'treegrids',
                        path: '/treegrids',
                        children: [{
                            name: 'treeGridDetail',
                            path: '/:id'
                        }]
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

    getAppOptions() {
        return [
            {
                name: 'theme',
                formField: {
                    item: select({
                        options: [
                            {value: 'light', label: 'Light'},
                            {value: 'dark', label: 'Dark'}
                        ]
                    })
                },
                fieldModel: {
                    rules: [required]
                },
                valueGetter: () => XH.darkTheme ? 'dark' : 'light',
                valueSetter: (v) => XH.acm.themeModel.setDarkTheme(v == 'dark')
            },
            {
                name: 'autoRefresh',
                prefName: 'xhAutoRefreshEnabled',
                formField: {
                    label: 'Auto-refresh',
                    info: `Enable to auto-refresh app data every ${XH.autoRefreshService.interval} seconds`,
                    item: switchInput()
                }
            }
        ];
    }

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async initAsync() {
        await XH.installServicesAsync(PortfolioService);
    }

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([], loadSpec);
    }
}
