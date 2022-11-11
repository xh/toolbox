import {HoistAppModel, XH, loadAllAsync, managed} from '@xh/hoist/core';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {themeAppOption, sizingModeAppOption, autoRefreshAppOption} from '@xh/hoist/mobile/cmp/appOption';
import {OauthService} from '../core/svc/OauthService';
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

export const App = {
    get model() {return AppModel.instance},
    get oauthService() {return OauthService.instance},
    get portfolioService() {return PortfolioService.instance}
};

export class AppModel extends HoistAppModel {

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
        return [
            themeAppOption(),
            sizingModeAppOption(),
            autoRefreshAppOption()
        ];
    }

    static override async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async initAsync() {
        await XH.installServicesAsync(PortfolioService);
    }

    override async logoutAsync() {
        await App.oauthService.logoutAsync();
    }

    override async doLoadAsync(loadSpec) {
        await loadAllAsync([], loadSpec);
    }
}
