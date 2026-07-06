import {InitContext, managed, XH} from '@xh/hoist/core';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/mobile/cmp/appOption';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {BaseAppModel} from '../BaseAppModel';
import {DocService} from '../core/svc/DocService';
import {GitHubService} from '../core/svc/GitHubService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {docsPage} from './docs/DocsPage';
import {docsLandingPage} from './docs/landing/DocsLandingPage';
import {docsCorpusPage} from './docs/corpus/DocsCorpusPage';
import {docsCategoryPage} from './docs/category/DocsCategoryPage';
import {docsSearchPage} from './docs/search/DocsSearchPage';
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
            // Standalone Docs section: landing (corpus chooser) -> corpus -> category -> reader,
            // plus a dedicated search screen. The reader (`doc`) is reused at every mount point.
            {id: 'docs', content: docsLandingPage},
            {id: 'corpus', content: docsCorpusPage},
            {id: 'category', content: docsCategoryPage},
            {id: 'search', content: docsSearchPage},
            {id: 'doc', content: docsPage}
        ]
    });

    override getRoutes() {
        // The single-doc reader (`doc`) is registered at three nodes, so its back-target always
        // follows its push origin via the Navigator stack: (1) a drilldown child of every example
        // (a Resources doc link stacks the reader on the example, back returns there); (2) the deepest
        // segment of the standalone docs browse stack (back climbs to the category doc list); and
        // (3) a child of the search screen (back returns to the results). The standalone Docs section
        // (`docs`) is the corpus-chooser landing - a top-level destination reached from the nav blade.
        const docReaderRoute = () => ({name: 'doc', path: '/doc/:source/:docId?section'});

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
                    ...examples.map(r => ({...r, children: [...r.children, docReaderRoute()]})),
                    {
                        name: 'docs',
                        path: '/docs',
                        children: [
                            {
                                name: 'corpus',
                                path: '/browse/:source',
                                children: [
                                    {
                                        name: 'category',
                                        path: '/:categoryId',
                                        children: [{name: 'doc', path: '/:docId?section'}]
                                    }
                                ]
                            },
                            {
                                name: 'search',
                                path: '/search',
                                children: [{name: 'doc', path: '/:source/:docId?section'}]
                            }
                        ]
                    }
                ]
            }
        ];
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([DocService, GitHubService, PortfolioService], ctx);
    }

    override async doLoadAsync(loadSpec) {
        await XH.gitHubService.loadAsync(loadSpec);
    }
}
