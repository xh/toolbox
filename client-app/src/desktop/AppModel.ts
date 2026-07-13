import {box, div, span, vbox} from '@xh/hoist/cmp/layout';
import {TabConfig, TabContainerModel, TabSwitcherConfig} from '@xh/hoist/cmp/tab';
import {InitContext, LoadSpec, managed, XH} from '@xh/hoist/core';
import {autoRefreshAppOption, sizingModeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {fmtDateTimeSec} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {makeObservable, runInAction} from '@xh/hoist/mobx';
import {ReactElement} from 'react';
import {isEmpty} from 'lodash';
import {BaseAppModel} from '../BaseAppModel';
import {cardChoiceInput} from './common';
import {DocService} from '../core/svc/DocService';
import {GitHubService} from '../core/svc/GitHubService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {
    gridTreeMapPanel,
    lineChartPanel,
    ohlcChartPanel,
    simpleTreeMapPanel,
    splitTreeMapPanel
} from './tabs/charts';
import {docsTab} from './tabs/docs/DocsTab';
import {examplesTab} from './tabs/examples/ExamplesTab';
import {formPanel, inputsPanel, pickerPanel, selectPanel, toolbarFormPanel} from './tabs/forms';
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
    cardPanel,
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
    groupedItemChooserPanel,
    iconsPanel,
    inspectorPanel,
    jsxPanel,
    leftRightChooserPanel,
    markdownPanel,
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

    constructor() {
        super();
        makeObservable(this);
    }

    @managed
    tabModel: TabContainerModel = this.createTabContainerModel();

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        this.applyFont(XH.getPref('font'));
        await XH.installServicesAsync([DocService, GitHubService, PortfolioService], ctx);

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
            // The two visual "appearance" choices lead the dialog as chunky, macOS-Settings-style
            // preview cards (custom `cardChoiceInput`), followed by the compact behavior controls.
            // Theme mirrors Hoist's built-in `themeAppOption` (xhTheme pref + XH.setTheme).
            {
                name: 'theme',
                prefName: 'xhTheme',
                refreshRequired: false,
                valueSetter: v => XH.setTheme(v),
                formField: {
                    label: 'Theme',
                    item: cardChoiceInput([
                        {value: 'light', label: 'Light', preview: this.themeSwatch('light')},
                        {value: 'dark', label: 'Dark', preview: this.themeSwatch('dark')},
                        {value: 'system', label: 'System', preview: this.themeSwatch('system')}
                    ])
                }
            },
            {
                name: 'font',
                refreshRequired: false,
                valueGetter: () => XH.getPref('font'),
                valueSetter: v => {
                    XH.setPref('font', v);
                    this.applyFont(v);
                },
                formField: {
                    label: 'Font',
                    item: cardChoiceInput([
                        {
                            value: 'IBM Plex Sans',
                            label: 'IBM Plex Sans',
                            preview: this.fontSwatch('IBM Plex Sans')
                        },
                        {value: 'Inter', label: 'Inter', preview: this.fontSwatch('Inter')}
                    ])
                }
            },
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
                    label: 'Profile pic menu',
                    info: 'Render the App Menu button using your profile pic',
                    item: switchInput()
                }
            }
        ];
    }

    /**
     * Apply the saved font preference by toggling the body class that activates IBM Plex Sans;
     * its absence falls back to Hoist's default Inter. See `tbox-font--plex` in App.scss.
     */
    private applyFont(font: string) {
        document.body.classList.toggle('tbox-font--plex', font === 'IBM Plex Sans');
    }

    /** A mini app-window mockup used as a theme-choice card preview (fixed light/dark, not live). */
    private themeSwatch(mode: 'light' | 'dark' | 'system'): ReactElement {
        return div({
            className: `tbox-theme-swatch tbox-theme-swatch--${mode}`,
            items: [
                div({
                    className: 'tbox-theme-swatch__chrome',
                    items: [0, 1, 2].map(i => div({key: i, className: 'tbox-theme-swatch__dot'}))
                }),
                div({
                    className: 'tbox-theme-swatch__content',
                    items: [
                        div({className: 'tbox-theme-swatch__accent'}),
                        div({className: 'tbox-theme-swatch__line'}),
                        div({className: 'tbox-theme-swatch__line tbox-theme-swatch__line--short'})
                    ]
                })
            ]
        });
    }

    /** A live type specimen rendered in the given face, used as a font-choice card preview. */
    private fontSwatch(font: 'IBM Plex Sans' | 'Inter'): ReactElement {
        const isPlex = font === 'IBM Plex Sans';
        return vbox({
            className: 'tbox-font-swatch',
            style: {
                fontFamily: isPlex
                    ? "'IBM Plex Sans', system-ui, sans-serif"
                    : 'Inter, system-ui, sans-serif',
                fontFeatureSettings: isPlex ? "'zero', 'ss01'" : 'normal'
            },
            items: [
                box({className: 'tbox-font-swatch__big', item: 'Aa'}),
                box({className: 'tbox-font-swatch__small', item: '0123'})
            ]
        });
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
                            {name: 'card', path: '/card'},
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
                            {name: 'select', path: '/select'},
                            {name: 'picker', path: '/picker'},
                            {name: 'toolbarForms', path: '/toolbarForms'}
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
                            {name: 'groupedItemChooser', path: '/groupedItemChooser'},
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
                        name: 'docs',
                        path: '/docs',
                        children: [{name: 'docRef', path: '/:source/:docId?section'}]
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
        const switcher: TabSwitcherConfig = {
            mode: 'static',
            extraMenuItems: [
                {
                    text: 'Open Tab in New Window',
                    icon: Icon.openExternal(),
                    actionFn: (_, {tab}) => {
                        const {params} = XH.router.getState();
                        XH.openWindow(
                            window.origin +
                                XH.router.buildPath(tab.containerModel.route + '.' + tab.id, params)
                        );
                    }
                }
            ]
        };
        const tabs: TabConfig[] = [
            {id: 'home', icon: Icon.home(), content: homeTab},
            {
                id: 'grids',
                icon: Icon.grid(),
                content: {
                    switcher,
                    tabs: [
                        {id: 'standard', content: standardGridPanel},
                        {id: 'tree', content: treeGridPanel},
                        {
                            id: 'treeWithCheckBox',
                            title: 'Tree w/CheckBox',
                            content: treeGridWithCheckboxPanel
                        },
                        {id: 'columnFiltering', content: columnFilteringPanel},
                        {id: 'inlineEditing', content: inlineEditingPanel},
                        {id: 'zoneGrid', title: 'Zone Grid', content: zoneGridPanel},
                        {id: 'dataview', title: 'DataView', content: dataViewPanel},
                        {
                            id: 'groupedCols',
                            title: 'Grouped Columns',
                            content: columnGroupsGridPanel
                        },
                        {id: 'externalSort', content: externalSortGridPanel},
                        {id: 'rest', title: 'REST Editor', content: restGridPanel},
                        {id: 'agGrid', title: 'AG Grid Wrapper', content: agGridView}
                    ]
                }
            },
            {
                id: 'panels',
                icon: Icon.window(),
                content: {
                    switcher,
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
                    switcher,
                    tabs: [
                        {id: 'hbox', title: 'HBox', content: hboxContainerPanel},
                        {id: 'vbox', title: 'VBox', content: vboxContainerPanel},
                        {id: 'card', title: 'Card', content: cardPanel},
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
                    switcher,
                    tabs: [
                        {id: 'form', title: 'FormModel', content: formPanel},
                        {id: 'inputs', title: 'Hoist Inputs', content: inputsPanel},
                        {id: 'select', title: 'Select', content: selectPanel},
                        {id: 'picker', title: 'Picker', content: pickerPanel},
                        {id: 'toolbarForms', title: 'Toolbar Forms', content: toolbarFormPanel}
                    ]
                }
            },
            {
                id: 'charts',
                icon: Icon.chartLine(),
                content: {
                    switcher,
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
                    switcher,
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
                        {
                            id: 'groupedItemChooser',
                            title: 'GroupedItemChooser',
                            content: groupedItemChooserPanel
                        },
                        {id: 'icons', content: iconsPanel},
                        {id: 'inspector', content: inspectorPanel},
                        {
                            id: 'leftRightChooser',
                            title: 'LeftRightChooser',
                            content: leftRightChooserPanel
                        },
                        {id: 'markdown', content: markdownPanel},
                        {id: 'pinPad', title: 'PIN Pad', content: pinPadPanel},
                        {id: 'placeholder', title: 'Placeholder', content: placeholderPanel},
                        {id: 'popups', content: popupsPanel},
                        {id: 'simpleRouting', content: simpleRoutingPanel},
                        {id: 'timestamp', content: relativeTimestampPanel}
                    ]
                }
            },
            {id: 'docs', icon: Icon.book(), content: docsTab},
            {id: 'examples', title: 'Example Apps', icon: Icon.boxFull(), content: examplesTab}
        ];
        return new TabContainerModel({
            persistWith: {localStorageKey: 'tabState'},
            route: 'default',
            track: true,
            tabs,
            switcher: {
                mode: 'dynamic',
                initialFavorites: tabs.map(it => it.id),
                extraMenuItems: [
                    ...switcher.extraMenuItems,
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
