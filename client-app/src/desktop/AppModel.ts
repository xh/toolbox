import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistAppModel, managed, XH} from '@xh/hoist/core';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {GitHubService} from '../core/svc/GitHubService';
import {OauthService} from '../core/svc/OauthService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {chartsTab} from './tabs/charts/ChartsTab';
import {layoutTab} from './tabs/layout/LayoutTab';
import {examplesTab} from './tabs/examples/ExamplesTab';
import {formsTab} from './tabs/forms/FormsTab';
import {gridsTab} from './tabs/grids/GridsTab';
import {homeTab} from './tabs/home/HomeTab';
import {mobileTab} from './tabs/mobile/MobileTab';
import {otherTab} from './tabs/other/OtherTab';
import {panelsTab} from './tabs/panels/PanelsTab';
import {fmtDateTimeSec} from '@xh/hoist/format';
import {span} from '@xh/hoist/cmp/layout';


declare module '@xh/hoist/core' {
// eslint-disable-next-line
    interface HoistUser {
        profilePicUrl: string;
    }
}

export const App = {
    get model()             {return XH.appModel as AppModel},
    get oauthService()      {return XH.getService(OauthService)},
    get portfolioService()  {return XH.getService(PortfolioService)},
    get gitHubService()     {return XH.getService(GitHubService)}
};

export class AppModel extends HoistAppModel {

    static instance: AppModel;

    @managed
    tabModel: TabContainerModel = new TabContainerModel({
        route: 'default',
        track: true,
        switcher: false,
        tabs: [
            {id: 'home', icon: Icon.home(), content: homeTab},
            {id: 'grids', icon: Icon.grid(), content: gridsTab},
            {id: 'panels', icon: Icon.window(), content: panelsTab},
            {id: 'layout', icon: Icon.layout(), content: layoutTab},
            {id: 'forms', icon: Icon.edit(), content: formsTab},
            {id: 'charts', icon: Icon.chartLine(), content: chartsTab},
            {id: 'mobile', icon: Icon.mobile(), content: mobileTab},
            {id: 'other', icon: Icon.boxFull(), content: otherTab},
            {id: 'examples', icon: Icon.books(), content: examplesTab}
        ]
    });

    static override async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async initAsync() {
        await XH.installServicesAsync(GitHubService, PortfolioService);

        // Demo app-specific handling of EnvironmentService.serverVersion observable.
        this.addReaction({
            track: () => [XH.environmentService.serverVersion, XH.environmentService.serverBuild],
            run: ([serverVersion, serverBuild]) => {
                XH.toast({
                    message: `A new version of Toolbox has been deployed to the server with version ${serverVersion} and build ${serverBuild}.`
                });
            }
        });
    }

    override async doLoadAsync(loadSpec) {
        await App.gitHubService.loadAsync(loadSpec);
    }

    override async logoutAsync() {
        await App.oauthService.logoutAsync();
    }

    goHome() {
        this.tabModel.activateTab('home');
    }

    override getAppOptions() {
        return [
            themeAppOption(),
            sizingModeAppOption(),
            autoRefreshAppOption(),
            {
                name: 'expandDockedLinks',
                prefName: 'expandDockedLinks',
                formField: {
                    label: 'Expand Links',
                    info: 'Enable to always expand the docked Links panel when available.',
                    item: switchInput()
                }
            }
        ];
    }

    override getRoutes() {
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
                        name: 'layout',
                        path: '/layout',
                        children: [
                            {name: 'hbox', path: '/hbox'},
                            {name: 'vbox', path: '/vbox'},
                            {name: 'tabPanel', path: '/tabPanel'},
                            {name: 'dock', path: '/dock'},
                            {name: 'dashContainer', path: '/dashContainer'},
                            {name: 'dashCanvas', path: '/dashCanvas'},
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
                            {name: 'columnFiltering', path: '/columnFiltering'},
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
                            {name: 'exceptionHandler', path: '/exceptionHandler'},
                            {name: 'fileChooser', path: '/fileChooser'},
                            {name: 'icons', path: '/icons'},
                            {name: 'inspector', path: '/inspector'},
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

    override getAboutDialogItems() {
        const lastGitHubCommit = fmtDateTimeSec(App.gitHubService.commitHistories.toolbox?.lastCommitTimestamp);
        return [
            ...super.getAboutDialogItems(),
            {
                label: span(Icon.icon({iconName: 'github', prefix: 'fab'}), 'Last Commit'),
                value: lastGitHubCommit,
                omit: !lastGitHubCommit
            }
        ];
    }
}
