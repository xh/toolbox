import {InitContext, loadAllAsync, managed, XH} from '@xh/hoist/core';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/mobile/cmp/appOption';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {runInAction} from '@xh/hoist/mobx';
import {BaseAppModel} from '../BaseAppModel';
import {DocService} from '../core/svc/DocService';
import {GitHubService} from '../core/svc/GitHubService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {docsPage} from './docs/DocsPage';
import {HomeModel} from './home/HomeModel';
import {NavBladeModel} from './cmp/navBlade/NavBladeModel';
import {badgePage} from './badge/BadgePage';
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
import {inputsPage} from './inputs/InputsPage';
import {maskPage} from './mask/MaskPage';
import {panelsPage} from './panels/PanelsPage';
import {pinPadPage} from './pinPad/PinPadPage';
import {popoverPage} from './popover/PopoverPage';
import {popupsPage} from './popups/PopupsPage';
import {selectPage} from './select/SelectPage';
import {tabsPage} from './tabs/TabsPage';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    @managed
    navBladeModel: NavBladeModel = new NavBladeModel();

    @managed
    homeModel: HomeModel = new HomeModel();

    @managed
    navigatorModel: NavigatorModel = new NavigatorModel({
        track: true,
        pages: [
            {id: 'default', content: homePage},
            {id: 'grid', content: gridPage},
            {id: 'gridDetail', content: gridDetailPage},
            {id: 'treeGrid', content: treeGridPage},
            {id: 'treeGridDetail', content: treeGridDetailPage},
            {id: 'zoneGrid', content: zoneGridPage},
            {id: 'dataView', content: dataViewPage},
            {id: 'form', content: formPage},
            {id: 'inputs', content: inputsPage},
            {id: 'select', content: selectPage},
            {id: 'chart', content: chartPage},
            {id: 'treeMap', content: treeMapPage},
            {id: 'containers', content: containersPage},
            {id: 'panel', content: panelsPage},
            {id: 'tabs', content: tabsPage},
            {id: 'popover', content: popoverPage},
            {id: 'popups', content: popupsPage},
            {id: 'badges', content: badgePage},
            {id: 'buttons', content: buttonPage},
            {id: 'icons', content: iconPage},
            {id: 'mask', content: maskPage},
            {id: 'pinPad', content: pinPadPage},
            {id: 'docs', content: docsPage}
        ]
    });

    override getRoutes() {
        return [
            {
                name: 'default',
                path: '/mobile',
                children: [
                    {
                        name: 'grid',
                        path: '/grid',
                        children: [
                            {
                                name: 'gridDetail',
                                path: '/:id<\\d+>'
                            }
                        ]
                    },
                    {
                        name: 'treeGrid',
                        path: '/treeGrid',
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
                        name: 'dataView',
                        path: '/dataView'
                    },
                    {
                        name: 'form',
                        path: '/form'
                    },
                    {
                        name: 'inputs',
                        path: '/inputs'
                    },
                    {
                        name: 'select',
                        path: '/select'
                    },
                    {
                        name: 'chart',
                        path: '/chart'
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
                        name: 'panel',
                        path: '/panel'
                    },
                    {
                        name: 'tabs',
                        path: '/tabs'
                    },
                    {
                        name: 'popover',
                        path: '/popover'
                    },
                    {
                        name: 'popups',
                        path: '/popups'
                    },
                    {
                        name: 'badges',
                        path: '/badges'
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
                        name: 'mask',
                        path: '/mask'
                    },
                    {
                        name: 'pinPad',
                        path: '/pinPad'
                    },
                    {
                        name: 'docs',
                        path: '/docs/:source/:docId?section'
                    }
                ]
            }
        ];
    }

    override getAppOptions() {
        return [
            themeAppOption(),
            sizingModeAppOption(),
            autoRefreshAppOption(),
            {
                name: 'appMenuButtonWithUserProfile',
                valueSetter: v => {
                    runInAction(() => (this.renderWithUserProfile = v));
                    XH.setPref('appMenuButtonWithUserProfile', v);
                },
                valueGetter: () => XH.getPref('appMenuButtonWithUserProfile'),
                formField: {
                    label: 'Profile pic app menu',
                    info: 'Render the App Menu button using your profile pic',
                    item: switchInput()
                }
            }
        ];
    }

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([DocService, GitHubService, PortfolioService], ctx);
    }

    override async doLoadAsync(loadSpec) {
        await loadAllAsync([], loadSpec);
    }
}
