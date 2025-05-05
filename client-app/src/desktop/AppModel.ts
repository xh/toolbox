import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {LoadSpec, managed, XH} from '@xh/hoist/core';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {GitHubService} from '../core/svc/GitHubService';
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
import {BaseAppModel} from '../BaseAppModel';

export class AppModel extends BaseAppModel {
    /** Singleton instance reference - installed by XH upon init. */
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

    override async initAsync() {
        await super.initAsync();
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

    override async doLoadAsync(loadSpec: LoadSpec) {
        await XH.gitHubService.loadAsync(loadSpec);
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
                            {name: 'externalSort', path: '/externalSort'},
                            {name: 'zoneGrid', path: '/zoneGrid'},
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
                            {name: 'errorMessage', path: '/errorMessage'},
                            {name: 'exceptionHandler', path: '/exceptionHandler'},
                            {name: 'fileChooser', path: '/fileChooser'},
                            {name: 'formatDates', path: '/formatDates'},
                            {name: 'formatNumbers', path: '/formatNumbers'},
                            {name: 'icons', path: '/icons'},
                            {name: 'inspector', path: '/inspector'},
                            {name: 'jsx', path: '/jsx'},
                            {name: 'leftRightChooser', path: '/leftRightChooser'},
                            {name: 'markdown', path: '/markdown'},
                            {name: 'pinPad', path: '/pinPad'},
                            {name: 'placeholder', path: '/placeholder'},
                            {name: 'popups', path: '/popups'},
                            {
                                name: 'simpleRouting',
                                path: '/simpleRouting',
                                children: [{name: 'recordId', path: '/:recordId'}]
                            },
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
        const lastGitHubCommit = fmtDateTimeSec(
            XH.gitHubService.commitHistories.toolbox?.lastCommitTimestamp
        );
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
