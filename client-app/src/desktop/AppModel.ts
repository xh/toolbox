import {span} from '@xh/hoist/cmp/layout';
import {TabContainerModel, TabModel} from '@xh/hoist/cmp/tab';
import {LoadSpec, managed, XH} from '@xh/hoist/core';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {fmtDateTimeSec} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import {BaseAppModel} from '../BaseAppModel';
import {GitHubService} from '../core/svc/GitHubService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {
    gridTreeMapPanel,
    lineChartPanel,
    ohlcChartPanel,
    simpleTreeMapPanel,
    splitTreeMapPanel
} from './tabs/charts';
import {examplesTab} from './tabs/examples/ExamplesTab';
import {formPanel, inputsPanel, toolbarFormPanel} from './tabs/forms';
import {
    agGridView,
    columnFilteringPanel,
    columnGroupsGridPanel,
    dataViewPanel,
    externalSortGridPanel,
    inlineEditingPanel,
    restGridPanel,
    standardGridPanel,
    treeGridPanel,
    treeGridWithCheckboxPanel,
    zoneGridPanel
} from './tabs/grids';
import {homeTab} from './tabs/home/HomeTab';
import {
    dashCanvasPanel,
    dashContainerPanel,
    dockContainerPanel,
    hboxContainerPanel,
    tabPanelContainerPanel,
    tileFrameContainerPanel,
    vboxContainerPanel
} from './tabs/layout';
import {mobileTab} from './tabs/mobile/MobileTab';
import {
    appNotificationsPanel,
    buttonsPanel,
    clockPanel,
    customPackagePanel,
    dateFormatsPanel,
    errorMessagePanel,
    exceptionHandlerPanel,
    fileChooserPanel,
    iconsPanel,
    inspectorPanel,
    jsxPanel,
    leftRightChooserPanel,
    numberFormatsPanel,
    pinPadPanel,
    placeholderPanel,
    popupsPanel,
    relativeTimestampPanel,
    simpleRoutingPanel
} from './tabs/other';
import {
    basicPanel,
    loadingIndicatorPanel,
    maskPanel,
    panelSizingPanel,
    toolbarPanel
} from './tabs/panels';

export class AppModel extends BaseAppModel {
    /** Singleton instance reference - installed by XH upon init. */
    static instance: AppModel;

    @managed
    tabModel: TabContainerModel = this.createTabContainerModel();

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

    // -------------------------------
    // Implementation
    // -------------------------------
    private createTabContainerModel(): TabContainerModel {
        const tabs = [
            {id: 'home', icon: Icon.home(), content: homeTab},
            {
                id: 'grids',
                icon: Icon.grid(),
                content: {
                    // switcher: {orientation: 'left', className: 'tb-switcher'}, // TODO revisit
                    tabs: [
                        {id: 'standard', content: standardGridPanel},
                        {id: 'tree', content: treeGridPanel},
                        {id: 'columnFiltering', content: columnFilteringPanel},
                        {id: 'inlineEditing', content: inlineEditingPanel},
                        {id: 'zoneGrid', title: 'Zone Grid', content: zoneGridPanel},
                        {id: 'dataview', title: 'DataView', content: dataViewPanel},
                        {
                            id: 'treeWithCheckBox',
                            title: 'Tree w/CheckBox',
                            content: treeGridWithCheckboxPanel
                        },
                        {
                            id: 'groupedCols',
                            title: 'Grouped Columns',
                            content: columnGroupsGridPanel
                        },
                        {id: 'externalSort', content: externalSortGridPanel},
                        {id: 'rest', title: 'REST Editor', content: restGridPanel},
                        {id: 'agGrid', title: 'ag-Grid Wrapper', content: agGridView}
                    ]
                }
            },
            {
                id: 'panels',
                icon: Icon.window(),
                content: {
                    // switcher: {orientation: 'left', className: 'tb-switcher'}, // TODO revisit
                    tabs: [
                        {id: 'intro', content: basicPanel},
                        {id: 'toolbars', content: toolbarPanel},
                        {id: 'sizing', content: panelSizingPanel},
                        {id: 'mask', content: maskPanel},
                        {id: 'loadingIndicator', content: loadingIndicatorPanel}
                    ]
                }
            },
            {
                id: 'layout',
                icon: Icon.layout(),
                content: {
                    // switcher: {orientation: 'left', className: 'tb-switcher'}, // TODO revisit
                    tabs: [
                        {id: 'hbox', title: 'HBox', content: hboxContainerPanel},
                        {id: 'vbox', title: 'VBox', content: vboxContainerPanel},
                        {
                            id: 'tabPanel',
                            title: 'TabContainer',
                            content: tabPanelContainerPanel
                        },
                        {
                            id: 'dashContainer',
                            title: 'DashContainer',
                            content: dashContainerPanel
                        },
                        {id: 'dashCanvas', title: 'DashCanvas', content: dashCanvasPanel},
                        {id: 'dock', title: 'DockContainer', content: dockContainerPanel},
                        {id: 'tileFrame', title: 'TileFrame', content: tileFrameContainerPanel}
                    ]
                }
            },
            {
                id: 'forms',
                icon: Icon.edit(),
                content: {
                    // switcher: {orientation: 'left', className: 'tb-switcher'}, // TODO revisit
                    tabs: [
                        {id: 'form', title: 'FormModel', content: formPanel},
                        {id: 'inputs', title: 'Hoist Inputs', content: inputsPanel},
                        {id: 'toolbarForm', title: 'Toolbar Forms', content: toolbarFormPanel}
                    ]
                }
            },
            {
                id: 'charts',
                icon: Icon.chartLine(),
                content: {
                    // switcher: {orientation: 'left', className: 'tb-switcher'}, // TODO revisit
                    tabs: [
                        {id: 'line', content: lineChartPanel},
                        {id: 'ohlc', title: 'OHLC', content: ohlcChartPanel},
                        {id: 'simpleTreeMap', title: 'TreeMap', content: simpleTreeMapPanel},
                        {id: 'gridTreeMap', title: 'Grid TreeMap', content: gridTreeMapPanel},
                        {id: 'splitTreeMap', title: 'Split TreeMap', content: splitTreeMapPanel}
                    ]
                }
            },
            {id: 'mobile', icon: Icon.mobile(), content: mobileTab},
            {
                id: 'other',
                icon: Icon.boxFull(),
                content: {
                    // switcher: {orientation: 'left', className: 'tb-switcher'}, // TODO revisit
                    tabs: [
                        {id: 'appNotifications', content: appNotificationsPanel},
                        {id: 'buttons', content: buttonsPanel},
                        {id: 'clock', content: clockPanel},
                        {id: 'customPackage', content: customPackagePanel},
                        {id: 'errorMessage', title: 'ErrorMessage', content: errorMessagePanel},
                        {
                            id: 'exceptionHandler',
                            title: 'Exception Handling',
                            content: exceptionHandlerPanel
                        },
                        {id: 'jsx', title: 'Factories vs. JSX', content: jsxPanel},
                        {id: 'fileChooser', title: 'FileChooser', content: fileChooserPanel},
                        {id: 'formatDates', content: dateFormatsPanel},
                        {id: 'formatNumbers', content: numberFormatsPanel},
                        {id: 'icons', content: iconsPanel},
                        {id: 'inspector', content: inspectorPanel},
                        {
                            id: 'leftRightChooser',
                            title: 'LeftRightChooser',
                            content: leftRightChooserPanel
                        },
                        {id: 'pinPad', title: 'PIN Pad', content: pinPadPanel},
                        {id: 'placeholder', title: 'Placeholder', content: placeholderPanel},
                        {id: 'popups', content: popupsPanel},
                        {id: 'timestamp', content: relativeTimestampPanel},
                        {id: 'simpleRouting', content: simpleRoutingPanel}
                    ]
                }
            },
            {id: 'examples', icon: Icon.books(), content: examplesTab}
        ];
        return new TabContainerModel({
            persistWith: {localStorageKey: 'tabState'},
            route: 'default',
            track: true,
            tabs,
            switcher: {
                initialFavorites: tabs.map(it => it.id),
                extraMenuItems: [
                    {
                        text: 'Open Tab in New Window',
                        icon: Icon.openExternal(),
                        actionFn: (_, {tab}) => {
                            if (tab instanceof TabModel) {
                                const {params} = XH.router.getState();
                                XH.openWindow(
                                    window.origin +
                                        XH.router.buildPath(
                                            tab.containerModel.route + '.' + tab.id,
                                            params
                                        )
                                );
                            }
                        },
                        prepareFn: (me, {tab}) => {
                            if (!(tab instanceof TabModel)) {
                                me.hidden = true;
                            }
                        }
                    },
                    '-',
                    {
                        text: 'More Tabs...',
                        prepareFn: me => {
                            const tabs = this.tabModel.tabs.filter(
                                ({id}) =>
                                    !this.tabModel.dynamicTabSwitcherModel.visibleTabs.some(
                                        it => it.id === id
                                    )
                            );
                            if (isEmpty(tabs)) {
                                me.hidden = true;
                            } else {
                                me.hidden = false;
                                me.items = tabs.map(tab => ({
                                    text: tab.title,
                                    icon: tab.icon,
                                    actionFn: () => this.tabModel.activateTab(tab)
                                }));
                            }
                        }
                    }
                ]
            }
        });
    }
}
