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
import {gridTreeMapPanel} from './tabs/charts/GridTreeMapPanel';
import {lineChartPanel} from './tabs/charts/LineChartPanel';
import {ohlcChartPanel} from './tabs/charts/OHLCChartPanel';
import {simpleTreeMapPanel} from './tabs/charts/SimpleTreeMapPanel';
import {splitTreeMapPanel} from './tabs/charts/SplitTreeMapPanel';
import {formPanel} from './tabs/forms/FormPanel';
import {inputsPanel} from './tabs/forms/InputsPanel';
import {toolbarFormPanel} from './tabs/forms/ToolbarFormPanel';
import {agGridView} from './tabs/grids/AgGridView';
import {columnFilteringPanel} from './tabs/grids/ColumnFilteringPanel';
import {columnGroupsGridPanel} from './tabs/grids/ColumnGroupsGridPanel';
import {dataViewPanel} from './tabs/grids/DataViewPanel';
import {externalSortGridPanel} from './tabs/grids/ExternalSortGridPanel';
import {inlineEditingPanel} from './tabs/grids/InlineEditingPanel';
import {restGridPanel} from './tabs/grids/RestGridPanel';
import {standardGridPanel} from './tabs/grids/StandardGridPanel';
import {treeGridPanel} from './tabs/grids/TreeGridPanel';
import {treeGridWithCheckboxPanel} from './tabs/grids/TreeGridWithCheckboxPanel';
import {zoneGridPanel} from './tabs/grids/ZoneGridPanel';
import {dashCanvasPanel} from './tabs/layout/dashCanvas/DashCanvasPanel';
import {dashContainerPanel} from './tabs/layout/dashContainer/DashContainerPanel';
import {dockContainerPanel} from './tabs/layout/DockContainerPanel';
import {hboxContainerPanel} from './tabs/layout/HBoxContainerPanel';
import {examplesTab} from './tabs/examples/ExamplesTab';
import {homeTab} from './tabs/home/HomeTab';
import {tabPanelContainerPanel} from './tabs/layout/tabContainer/TabPanelContainerPanel';
import {tileFrameContainerPanel} from './tabs/layout/TileFrameContainerPanel';
import {vboxContainerPanel} from './tabs/layout/VBoxContainerPanel';
import {mobileTab} from './tabs/mobile/MobileTab';
import {appNotificationsPanel} from './tabs/other/AppNotificationsPanel';
import {buttonsPanel} from './tabs/other/Buttons';
import {clockPanel} from './tabs/other/ClockPanel';
import {customPackagePanel} from './tabs/other/CustomPackagePanel';
import {errorMessagePanel} from './tabs/other/ErrorMessagePanel';
import {exceptionHandlerPanel} from './tabs/other/exceptions/ExceptionHandlerPanel';
import {fileChooserPanel} from './tabs/other/FileChooserPanel';
import {dateFormatsPanel} from './tabs/other/formats/DateFormatsPanel';
import {numberFormatsPanel} from './tabs/other/formats/NumberFormatsPanel';
import {iconsPanel} from './tabs/other/IconsPanel';
import {inspectorPanel} from './tabs/other/InspectorPanel';
import {jsxPanel} from './tabs/other/JsxPanel';
import {leftRightChooserPanel} from './tabs/other/LeftRightChooserPanel';
import {pinPadPanel} from './tabs/other/PinPadPanel';
import {placeholderPanel} from './tabs/other/PlaceholderPanel';
import {popupsPanel} from './tabs/other/PopupsPanel';
import {relativeTimestampPanel} from './tabs/other/relativetimestamp/RelativeTimestampPanel';
import {simpleRoutingPanel} from './tabs/other/routing/SimpleRoutingPanel';
import {basicPanel} from './tabs/panels/BasicPanel';
import {loadingIndicatorPanel} from './tabs/panels/LoadingIndicatorPanel';
import {maskPanel} from './tabs/panels/MaskPanel';
import {panelSizingPanel} from './tabs/panels/PanelSizingPanel';
import {fmtDateTimeSec} from '@xh/hoist/format';
import {span} from '@xh/hoist/cmp/layout';
import {BaseAppModel} from '../BaseAppModel';
import {toolbarPanel} from './tabs/panels/ToolbarPanel';

export class AppModel extends BaseAppModel {
    /** Singleton instance reference - installed by XH upon init. */
    static instance: AppModel;

    @managed
    tabModel: TabContainerModel;

    override async initAsync() {
        await super.initAsync();
        this.tabModel = new TabContainerModel(
            XH.navigationManager.getTabContainerConfig({track: true, switcher: false})
        );
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
        return XH.navigationManager.routes;
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

    override setupNavigationManager() {
        XH.navigationManager.setNavigationData({
            id: 'default',
            path: '/app',
            children: [
                {id: 'home', icon: Icon.home(), content: homeTab},
                {
                    id: 'grids',
                    icon: Icon.grid(),
                    children: [
                        {id: 'standard', content: standardGridPanel},
                        {id: 'tree', content: treeGridPanel},
                        {
                            id: 'columnFiltering',
                            content: columnFilteringPanel
                        },
                        {id: 'inlineEditing', content: inlineEditingPanel},
                        {
                            id: 'zoneGrid',
                            title: 'Zone Grid',
                            content: zoneGridPanel
                        },
                        {
                            id: 'dataview',
                            title: 'DataView',
                            content: dataViewPanel
                        },
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
                        {
                            id: 'agGrid',
                            title: 'ag-Grid Wrapper',
                            content: agGridView
                        }
                    ],
                    switcher: {orientation: 'left'}
                },
                {
                    id: 'panels',
                    icon: Icon.window(),
                    switcher: {orientation: 'left'},
                    children: [
                        {id: 'intro', content: basicPanel},
                        {id: 'toolbars', content: toolbarPanel},
                        {id: 'sizing', content: panelSizingPanel},
                        {id: 'mask', content: maskPanel},
                        {id: 'loadingIndicator', content: loadingIndicatorPanel}
                    ]
                },
                {
                    id: 'layout',
                    icon: Icon.layout(),
                    switcher: {orientation: 'left'},
                    children: [
                        {id: 'hbox', title: 'HBox', content: hboxContainerPanel},
                        {id: 'vbox', title: 'VBox', content: vboxContainerPanel},
                        {id: 'tabPanel', title: 'TabContainer', content: tabPanelContainerPanel},
                        {id: 'dashContainer', title: 'DashContainer', content: dashContainerPanel},
                        {id: 'dashCanvas', title: 'DashCanvas', content: dashCanvasPanel},
                        {id: 'dock', title: 'DockContainer', content: dockContainerPanel},
                        {id: 'tileFrame', title: 'TileFrame', content: tileFrameContainerPanel}
                    ]
                },
                {
                    id: 'forms',
                    icon: Icon.edit(),
                    switcher: {orientation: 'left'},
                    children: [
                        {id: 'form', title: 'FormModel', content: formPanel},
                        {id: 'inputs', title: 'Hoist Inputs', content: inputsPanel},
                        {id: 'toolbarForm', title: 'Toolbar Forms', content: toolbarFormPanel}
                    ]
                },
                {
                    id: 'charts',
                    icon: Icon.chartLine(),
                    switcher: {orientation: 'left'},
                    children: [
                        {id: 'line', content: lineChartPanel},
                        {id: 'ohlc', title: 'OHLC', content: ohlcChartPanel},
                        {id: 'simpleTreeMap', title: 'TreeMap', content: simpleTreeMapPanel},
                        {id: 'gridTreeMap', title: 'Grid TreeMap', content: gridTreeMapPanel},
                        {id: 'splitTreeMap', title: 'Split TreeMap', content: splitTreeMapPanel}
                    ]
                },
                {id: 'mobile', icon: Icon.mobile(), content: mobileTab},
                {
                    id: 'other',
                    icon: Icon.boxFull(),
                    switcher: {orientation: 'left'},
                    children: [
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
                        {
                            id: 'simpleRouting',
                            content: simpleRoutingPanel,
                            children: [{id: 'recordId', path: '/:recordId'}]
                        }
                    ]
                },
                {id: 'examples', icon: Icon.books(), content: examplesTab}
            ]
        });
    }
}
