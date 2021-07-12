import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistAppModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {GitHubService} from '../core/svc/GitHubService';
import {OauthService} from '../core/svc/OauthService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {getAppOptions} from './AppOptions';
import {chartsTab} from './tabs/charts/ChartsTab';
import {containersTab} from './tabs/containers/ContainersTab';
import {examplesTab} from './tabs/examples/ExamplesTab';
import {formsTab} from './tabs/forms/FormsTab';
import {gridsTab} from './tabs/grids/GridsTab';
import {homeTab} from './tabs/home/HomeTab';
import {otherTab} from './tabs/other/OtherTab';
import {panelsTab} from './tabs/panels/PanelsTab';
import {mobileTab} from './tabs/mobile/MobileTab';

export class AppModel extends HoistAppModel {

    @managed
    tabModel = new TabContainerModel({
        route: 'default',
        track: true,
        switcher: false,
        tabs: [
            {id: 'home', icon: Icon.home(), content: homeTab},
            {id: 'grids', icon: Icon.grid(), content: gridsTab},
            {id: 'panels', icon: Icon.window(), content: panelsTab},
            {id: 'containers', icon: Icon.box(), content: containersTab},
            {id: 'forms', icon: Icon.edit(), content: formsTab},
            {id: 'charts', icon: Icon.chartLine(), content: chartsTab},
            {id: 'mobile', icon: Icon.mobile(), content: mobileTab},
            {id: 'other', icon: Icon.boxFull(), content: otherTab},
            {id: 'examples', icon: Icon.books(), content: examplesTab}
        ]
    });

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }

    static async preAuthAsync() {
        await XH.installServicesAsync(
            OauthService
        );
    }

    async initAsync() {
        await XH.installServicesAsync(
            GitHubService,
            PortfolioService
        );
    }

    async doLoadAsync(loadSpec) {
        await XH.gitHubService.loadAsync(loadSpec);
    }

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    goHome() {
        this.tabModel.setActiveTabId('home');
    }

    getAppOptions() {
        return getAppOptions();
    }

    getRoutes() {
        return [
            {
                name: 'default',
                path: '/app',
                children: [
                    {
                        name: 'home',
                        path: '/home'
                    },
                    {
                        name: 'containers',
                        path: '/containers',
                        children: [
                            {name: 'hbox', path: '/hbox'},
                            {name: 'vbox', path: '/vbox'},
                            {name: 'tabPanel', path: '/tabPanel'},
                            {name: 'dock', path: '/dock'},
                            {name: 'dash', path: '/dash'},
                            {name: 'tileFrame', path: '/tileFrame'}
                        ]
                    },
                    {
                        name: 'panels',
                        path: '/panels',
                        children: [
                            {name: 'intro', path: '/intro'},
                            {name: 'toolbars', path: '/toolbars'},
                            {name: 'sizing', path: '/sizing'},
                            {name: 'mask', path: '/mask'},
                            {name: 'loadingIndicator', path: '/loadingIndicator'}
                        ]
                    },
                    {
                        name: 'grids',
                        path: '/grids',
                        children: [
                            {name: 'standard', path: '/standard'},
                            {name: 'tree', path: '/tree?dims'},
                            {name: 'treeWithCheckBox', path: '/treeWithCheckBox'},
                            {name: 'groupedRows', path: '/groupedRows'},
                            {name: 'groupedCols', path: '/groupedCols'},
                            {name: 'rest', path: '/rest'},
                            {name: 'inlineEditing', path: '/inlineEditing'},
                            {name: 'dataview', path: '/dataview'},
                            {name: 'agGrid', path: '/agGrid'}
                        ]
                    },
                    {
                        name: 'forms',
                        path: '/forms',
                        children: [
                            {name: 'form', path: '/form'},
                            {name: 'inputs', path: '/inputs'},
                            {name: 'toolbarForm', path: '/toolbarForm'}
                        ]
                    },
                    {
                        name: 'charts',
                        path: '/charts',
                        children: [
                            {name: 'ohlc', path: '/ohlc'},
                            {name: 'line', path: '/line'},
                            {name: 'simpleTreeMap', path: '/simpleTreeMap'},
                            {name: 'gridTreeMap', path: '/gridTreeMap'},
                            {name: 'splitTreeMap', path: '/splitTreeMap'}
                        ]
                    },
                    {
                        name: 'mobile',
                        path: '/mobile'
                    },
                    {
                        name: 'other',
                        path: '/other',
                        children: [
                            {name: 'appNotifications', path: '/appNotifications'},
                            {name: 'buttons', path: '/buttons'},
                            {name: 'clock', path: '/clock'},
                            {name: 'customPackage', path: '/customPackage'},
                            {name: 'dateFormats', path: '/dateFormats'},
                            {name: 'jsx', path: '/jsx'},
                            {name: 'errorMessage', path: '/errorMessage'},
                            {name: 'fileChooser', path: '/fileChooser'},
                            {name: 'icons', path: '/icons'},
                            {name: 'leftRightChooser', path: '/leftRightChooser'},
                            {name: 'numberFormats', path: '/numberFormats'},
                            {name: 'pinPad', path: '/pinPad'},
                            {name: 'placeholder', path: '/placeholder'},
                            {name: 'popups', path: '/popups'},
                            {name: 'timestamp', path: '/timestamp'}
                        ]
                    },
                    {
                        name: 'examples',
                        path: '/examples'
                    }
                ]
            }
        ];
    }
}

/**
 * @typedef XH
 * @property {GitHubService} gitHubService
 * @property {OauthService} oauthService
 * @property {PortfolioService} portfolioService
 */
