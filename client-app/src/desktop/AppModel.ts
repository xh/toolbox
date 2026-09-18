import {box, div, span, vbox} from '@xh/hoist/cmp/layout';
import type {TabConfig, TabSwitcherConfig} from '@xh/hoist/cmp/tab';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import type {InitContext, LoadSpec} from '@xh/hoist/core';
import {managed, XH} from '@xh/hoist/core';
import {autoRefreshAppOption, sizingModeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {fmtDateTimeSec} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {runInAction} from '@xh/hoist/mobx';
import type {ReactElement} from 'react';
import {isEmpty, isEqual} from 'lodash';
import {BaseAppModel} from '../BaseAppModel';
import {cardChoiceInput} from './common/CardChoiceInput';
import {DocService} from '../core/svc/DocService';
import {GitHubService} from '../core/svc/GitHubService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {gridTreeMapPanel} from './tabs/charts/GridTreeMapPanel';
import {lineChartPanel} from './tabs/charts/LineChartPanel';
import {ohlcChartPanel} from './tabs/charts/OHLCChartPanel';
import {simpleTreeMapPanel} from './tabs/charts/SimpleTreeMapPanel';
import {splitTreeMapPanel} from './tabs/charts/SplitTreeMapPanel';
import {docsTab} from './tabs/docs/DocsTab';
import {examplesTab} from './tabs/examples/ExamplesTab';
import {buttonGroupInputPanel} from './tabs/forms/inputs/ButtonGroupInputPanel';
import {codeInputsPanel} from './tabs/forms/inputs/CodeInputsPanel';
import {dateInputPanel} from './tabs/forms/inputs/DateInputPanel';
import {dateRangePickerPanel} from './tabs/forms/DateRangePickerPanel';
import {fileChooserPanel} from './tabs/forms/FileChooserPanel';
import {formPanel} from './tabs/forms/FormPanel';
import {inputsIndexPanel} from './tabs/forms/inputs/InputsIndexPanel';
import {intentInputPanel} from './tabs/forms/inputs/IntentInputPanel';
import {leftRightChooserPanel} from './tabs/forms/LeftRightChooserPanel';
import {numberInputPanel} from './tabs/forms/inputs/NumberInputPanel';
import {otherControlsPanel} from './tabs/forms/inputs/OtherControlsPanel';
import {pickerPanel} from './tabs/forms/inputs/PickerPanel';
import {radioInputPanel} from './tabs/forms/inputs/RadioInputPanel';
import {segmentedControlPanel} from './tabs/forms/inputs/SegmentedControlPanel';
import {selectPanel} from './tabs/forms/inputs/SelectPanel';
import {sliderPanel} from './tabs/forms/inputs/SliderPanel';
import {textAreaPanel} from './tabs/forms/inputs/TextAreaPanel';
import {textInputPanel} from './tabs/forms/inputs/TextInputPanel';
import {togglesPanel} from './tabs/forms/inputs/TogglesPanel';
import {toolbarFormPanel} from './tabs/forms/ToolbarFormPanel';
import {agGridView} from './tabs/grids/AgGridView';
import {columnChooserPanel} from './tabs/grids/ColumnChooserPanel';
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
import {homeTab} from './tabs/home/HomeTab';
import {cardPanel} from './tabs/layout/CardPanel';
import {dashCanvasPanel} from './tabs/layout/dashCanvas/DashCanvasPanel';
import {dashContainerPanel} from './tabs/layout/dashContainer/DashContainerPanel';
import {dockContainerPanel} from './tabs/layout/DockContainerPanel';
import {hboxContainerPanel} from './tabs/layout/HBoxContainerPanel';
import {tabPanelContainerPanel} from './tabs/layout/tabContainer/TabPanelContainerPanel';
import {tileFrameContainerPanel} from './tabs/layout/TileFrameContainerPanel';
import {vboxContainerPanel} from './tabs/layout/VBoxContainerPanel';
import {mobileTab} from './tabs/mobile/MobileTab';
import {appNotificationsPanel} from './tabs/other/AppNotificationsPanel';
import {buttonsPanel} from './tabs/other/Buttons';
import {clockPanel} from './tabs/other/ClockPanel';
import {customPackagePanel} from './tabs/other/CustomPackagePanel';
import {dateFormatsPanel} from './tabs/other/formats/DateFormatsPanel';
import {errorMessagePanel} from './tabs/other/ErrorMessagePanel';
import {exceptionHandlerPanel} from './tabs/other/exceptions/ExceptionHandlerPanel';
import {iconsPanel} from './tabs/other/IconsPanel';
import {inspectorPanel} from './tabs/other/InspectorPanel';
import {jsxPanel} from './tabs/other/JsxPanel';
import {markdownPanel} from './tabs/other/MarkdownPanel';
import {numberFormatsPanel} from './tabs/other/formats/NumberFormatsPanel';
import {pinPadPanel} from './tabs/other/PinPadPanel';
import {placeholderPanel} from './tabs/other/PlaceholderPanel';
import {popupsPanel} from './tabs/other/PopupsPanel';
import {relativeTimestampPanel} from './tabs/other/relativetimestamp/RelativeTimestampPanel';
import {simpleRoutingPanel} from './tabs/other/routing/SimpleRoutingPanel';
import {basicPanel} from './tabs/panels/BasicPanel';
import {loadingIndicatorPanel} from './tabs/panels/LoadingIndicatorPanel';
import {maskPanel} from './tabs/panels/MaskPanel';
import {panelSizingPanel} from './tabs/panels/PanelSizingPanel';
import {toolbarPanel} from './tabs/panels/ToolbarPanel';

// Tab-level stylesheets, previously carried as side-effect imports by the `tabs/grids`
// and `tabs/layout` barrels. This file was those barrels' only consumer, so importing
// them here preserves the prior load behavior exactly.
import './tabs/grids/GridsTab.scss';
import './tabs/layout/LayoutTab.scss';

export class AppModel extends BaseAppModel {
    /** Singleton instance reference - installed by XH upon init. */
    static instance: AppModel;

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
                            {name: 'agGrid', path: '/agGrid'},
                            {name: 'columnChooser', path: '/columnChooser'}
                        ]
                    },
                    {
                        name: 'forms',
                        path: '/forms',
                        children: [
                            {name: 'form', path: '/form'},
                            {name: 'toolbarForms', path: '/toolbarForms'},
                            {name: 'inputs', path: '/inputs'},
                            {name: 'textInput', path: '/textInput'},
                            {name: 'textArea', path: '/textArea'},
                            {name: 'numberInput', path: '/numberInput'},
                            {name: 'dateInput', path: '/dateInput'},
                            {name: 'select', path: '/select'},
                            {name: 'picker', path: '/picker'},
                            {name: 'segmentedControl', path: '/segmentedControl'},
                            {name: 'buttonGroupInput', path: '/buttonGroupInput'},
                            {name: 'radioInput', path: '/radioInput'},
                            {name: 'toggles', path: '/toggles'},
                            {name: 'slider', path: '/slider'},
                            {name: 'intentInput', path: '/intentInput'},
                            {name: 'codeInputs', path: '/codeInputs'},
                            {name: 'otherControls', path: '/otherControls'},
                            {name: 'dateRangePicker', path: '/dateRangePicker'},
                            {name: 'leftRightChooser', path: '/leftRightChooser'},
                            {name: 'fileChooser', path: '/fileChooser'}
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
                            {name: 'formatDates', path: '/formatDates'},
                            {name: 'formatNumbers', path: '/formatNumbers'},
                            {name: 'icons', path: '/icons'},
                            {name: 'inspector', path: '/inspector'},
                            {name: 'jsx', path: '/jsx'},
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
                        {
                            id: 'columnChooser',
                            title: 'Column Chooser',
                            content: columnChooserPanel
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
                title: 'Forms + Inputs',
                icon: Icon.edit(),
                content: {
                    switcher,
                    // Concepts first, then the All Inputs index and one page per input.
                    tabs: [
                        {id: 'form', title: 'FormModel', content: formPanel},
                        {id: 'toolbarForms', title: 'Forms in Toolbars', content: toolbarFormPanel},
                        {
                            id: 'inputs',
                            title: 'All Inputs',
                            icon: Icon.grip(),
                            content: inputsIndexPanel
                        },
                        {id: 'textInput', title: 'TextInput', content: textInputPanel},
                        {id: 'textArea', title: 'TextArea', content: textAreaPanel},
                        {id: 'numberInput', title: 'NumberInput', content: numberInputPanel},
                        {id: 'dateInput', title: 'DateInput', content: dateInputPanel},
                        {id: 'select', title: 'Select', content: selectPanel},
                        {id: 'picker', title: 'Picker', content: pickerPanel},
                        {
                            id: 'segmentedControl',
                            title: 'SegmentedControl',
                            content: segmentedControlPanel
                        },
                        {
                            id: 'buttonGroupInput',
                            title: 'ButtonGroupInput',
                            content: buttonGroupInputPanel
                        },
                        {id: 'radioInput', title: 'RadioInput', content: radioInputPanel},
                        {id: 'toggles', title: 'Checkbox & Switch', content: togglesPanel},
                        {id: 'slider', title: 'Slider', content: sliderPanel},
                        {id: 'intentInput', title: 'IntentInput', content: intentInputPanel},
                        {id: 'codeInputs', title: 'JsonInput & Code', content: codeInputsPanel},
                        // Controls that take their own model rather than a `bind`, so they are
                        // not `HoistInput`s and cannot sit inside a FormField. Their own gallery
                        // leads them, keeping All Inputs an exact list of the HoistInput set.
                        {
                            id: 'otherControls',
                            title: 'Other Controls',
                            icon: Icon.grip(),
                            content: otherControlsPanel
                        },
                        {
                            id: 'dateRangePicker',
                            title: 'DateRangePicker',
                            content: dateRangePickerPanel
                        },
                        {
                            id: 'leftRightChooser',
                            title: 'LeftRightChooser',
                            content: leftRightChooserPanel
                        },
                        {id: 'fileChooser', title: 'FileChooser', content: fileChooserPanel}
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
                        {id: 'formatDates', content: dateFormatsPanel},
                        {id: 'formatNumbers', content: numberFormatsPanel},
                        {id: 'icons', content: iconsPanel},
                        {id: 'inspector', content: inspectorPanel},
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
        // Shared by `initialFavorites` and "Restore Defaults" menu item for consistent reset
        const defaultFavoriteTabIds = tabs.map(it => it.id);

        return new TabContainerModel({
            persistWith: {localStorageKey: 'tabState'},
            route: 'default',
            track: true,
            tabs,
            switcher: {
                mode: 'dynamic',
                initialFavorites: defaultFavoriteTabIds,
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
                    },
                    {
                        text: 'Restore Default Tabs',
                        icon: Icon.reset(),
                        // Disabled (rather than hidden) at defaults - the item stays discoverable
                        prepareFn: me => {
                            me.disabled = isEqual(
                                this.tabModel.dynamicTabSwitcherModel.favoriteTabIds,
                                defaultFavoriteTabIds
                            );
                        },
                        actionFn: () =>
                            this.tabModel.dynamicTabSwitcherModel.setFavoriteTabIds(
                                defaultFavoriteTabIds
                            )
                    }
                ]
            }
        });
    }
}
