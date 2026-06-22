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
        // The in-app docs reader is registered as a drilldown child of every example, so opening a
        // doc from an example stacks the reader on top of it - the standard app-bar back button and
        // the Navigator edge-swipe then both return to the example, exactly like the grid -> detail
        // drilldown. It is also registered as a standalone child of `default` for cold deep-links and
        // the home page, where there is no example to return to.
        const docsRoute = () => ({name: 'docs', path: '/docs/:source/:docId?section'});

        const examples = [
            {name: 'grid', path: '/grid', children: [{name: 'gridDetail', path: '/:id<\\d+>'}]},
            {
                name: 'treeGrid',
                path: '/treeGrid',
                children: [{name: 'treeGridDetail', path: '/:id'}]
            },
            {
                name: 'zoneGrid',
                path: '/zoneGrid',
                children: [{name: 'gridDetail', path: '/:id<\\d+>'}]
            },
            {name: 'dataView', path: '/dataView', children: []},
            {name: 'form', path: '/form', children: []},
            {name: 'inputs', path: '/inputs', children: []},
            {name: 'select', path: '/select', children: []},
            {name: 'chart', path: '/chart', children: []},
            {name: 'treeMap', path: '/treeMap', children: []},
            {name: 'containers', path: '/containers', children: []},
            {name: 'panel', path: '/panel', children: []},
            {name: 'tabs', path: '/tabs', children: []},
            {name: 'popover', path: '/popover', children: []},
            {name: 'popups', path: '/popups', children: []},
            {name: 'badges', path: '/badges', children: []},
            {name: 'buttons', path: '/buttons', children: []},
            {name: 'icons', path: '/icons', children: []},
            {name: 'mask', path: '/mask', children: []},
            {name: 'pinPad', path: '/pinPad', children: []}
        ];

        return [
            {
                name: 'default',
                path: '/mobile',
                children: [
                    ...examples.map(r => ({...r, children: [...r.children, docsRoute()]})),
                    docsRoute()
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
