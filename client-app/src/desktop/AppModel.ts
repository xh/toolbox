import {box, span, vbox} from '@xh/hoist/cmp/layout';
import type {TabConfig, TabSwitcherConfig} from '@xh/hoist/cmp/tab';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import type {InitContext, LoadSpec} from '@xh/hoist/core';
import {managed, XH} from '@xh/hoist/core';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {radioCardInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {fmtDateTimeSec} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {runInAction} from '@xh/hoist/mobx';
import type {ReactElement} from 'react';
import {isEmpty, isEqual} from 'lodash';
import {BaseAppModel} from '../BaseAppModel';
import {DocService} from '../core/svc/DocService';
import {GitHubService} from '../core/svc/GitHubService';
import {PortfolioService} from '../core/svc/PortfolioService';
import {gridTreeMapPanel} from './tabs/components/charts/GridTreeMapPanel';
import {lineChartPanel} from './tabs/components/charts/LineChartPanel';
import {ohlcChartPanel} from './tabs/components/charts/OHLCChartPanel';
import {simpleTreeMapPanel} from './tabs/components/charts/SimpleTreeMapPanel';
import {splitTreeMapPanel} from './tabs/components/charts/SplitTreeMapPanel';
import {docsTab} from './tabs/docs/DocsTab';
import {examplesTab} from './tabs/examples/ExamplesTab';
import {buttonGroupInputPanel} from './tabs/forms/inputs/ButtonGroupInputPanel';
import {codeInputsPanel} from './tabs/forms/inputs/CodeInputsPanel';
import {dateInputPanel} from './tabs/forms/inputs/DateInputPanel';
import {dateRangePickerPanel} from './tabs/components/choosers/DateRangePickerPanel';
import {fileChooserPanel} from './tabs/components/choosers/FileChooserPanel';
import {formPanel} from './tabs/forms/FormPanel';
import {inputsIndexPanel} from './tabs/forms/inputs/InputsIndexPanel';
import {iconPickerPanel} from './tabs/forms/inputs/IconPickerPanel';
import {intentInputPanel} from './tabs/forms/inputs/IntentInputPanel';
import {leftRightChooserPanel} from './tabs/components/choosers/LeftRightChooserPanel';
import {numberInputPanel} from './tabs/forms/inputs/NumberInputPanel';
import {pickerPanel} from './tabs/forms/inputs/PickerPanel';
import {radioCardInputPanel} from './tabs/forms/inputs/RadioCardInputPanel';
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
import {filterChooserPanel} from './tabs/grids/FilterChooserPanel';
import {gridFindFieldPanel} from './tabs/grids/GridFindFieldPanel';
import {groupingChooserPanel} from './tabs/grids/GroupingChooserPanel';
import {storeFilterFieldPanel} from './tabs/grids/StoreFilterFieldPanel';
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
import {appNotificationsPanel} from './tabs/system/UpdatesIdlePanel';
import {appOptionsPanel} from './tabs/system/AppOptionsPanel';
import {bannersPanel} from './tabs/system/dialogs/BannersPanel';
import {messagesPanel} from './tabs/system/dialogs/MessagesPanel';
import {toastPanel} from './tabs/system/dialogs/ToastPanel';
import {buttonsPanel} from './tabs/components/general/ButtonsPanel';
import {clockPanel} from './tabs/components/general/ClockPanel';
import {customPackagePanel} from './tabs/system/CustomPackagePanel';
import {dateFormatsPanel} from './tabs/system/formats/DateFormatsPanel';
import {errorMessagePanel} from './tabs/components/general/ErrorMessagePanel';
import {exceptionHandlerPanel} from './tabs/system/exceptions/ExceptionHandlerPanel';
import {iconsPanel} from './tabs/components/general/IconsPanel';
import {inspectorPanel} from './tabs/system/InspectorPanel';
import {jsxPanel} from './tabs/system/JsxPanel';
import {markdownPanel} from './tabs/components/general/MarkdownPanel';
import {numberFormatsPanel} from './tabs/system/formats/NumberFormatsPanel';
import {pinPadPanel} from './tabs/components/general/PinPadPanel';
import {placeholderPanel} from './tabs/components/general/PlaceholderPanel';
import {relativeTimestampPanel} from './tabs/components/general/relativetimestamp/RelativeTimestampPanel';
import {simpleRoutingPanel} from './tabs/system/routing/SimpleRoutingPanel';
import {bannerPanel} from './tabs/layout/panels/BannerPanel';
import {basicPanel} from './tabs/layout/panels/BasicPanel';
import {loadingIndicatorPanel} from './tabs/layout/panels/LoadingIndicatorPanel';
import {maskPanel} from './tabs/layout/panels/MaskPanel';
import {panelSizingPanel} from './tabs/layout/panels/PanelSizingPanel';
import {toolbarPanel} from './tabs/layout/panels/ToolbarPanel';

// Tab-level stylesheets, previously carried as side-effect imports by the `tabs/grids`
// and `tabs/layout` barrels. This file was those barrels' only consumer, so importing
// them here preserves the prior load behavior exactly.
import './tabs/grids/GridsTab.scss';
import './tabs/layout/LayoutTab.scss';
import {githubIcon} from '../core/Icons';

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
            // Theme, Font, and Grid sizing render as preview cards, then the compact switches.
            themeAppOption(),
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
                    item: radioCardInput({
                        options: [
                            {
                                value: 'IBM Plex Sans',
                                label: 'IBM Plex',
                                preview: this.fontSwatch('IBM Plex Sans')
                            },
                            {value: 'Inter', label: 'Inter', preview: this.fontSwatch('Inter')}
                        ]
                    })
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
        // Child routes for the TabContainer example's nested people/places/things containers.
        const simpleTabRoutes = () =>
            ['people', 'places', 'things'].map(name => ({name, path: `/${name}`}));

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
                            {name: 'intro', path: '/intro'},
                            {name: 'toolbars', path: '/toolbars'},
                            {name: 'sizing', path: '/sizing'},
                            {name: 'mask', path: '/mask'},
                            {name: 'loadingIndicator', path: '/loadingIndicator'},
                            {name: 'banner', path: '/banner'},
                            {name: 'hbox', path: '/hbox'},
                            {name: 'vbox', path: '/vbox'},
                            {name: 'card', path: '/card'},
                            {
                                name: 'tabPanel',
                                path: '/tabPanel',
                                children: [
                                    {name: 'top', path: '/top'},
                                    {name: 'bottom', path: '/bottom', children: simpleTabRoutes()},
                                    {name: 'left', path: '/left', children: simpleTabRoutes()},
                                    {name: 'right', path: '/right', children: simpleTabRoutes()},
                                    {name: 'groups', path: '/groups'},
                                    {name: 'custom', path: '/custom', children: simpleTabRoutes()},
                                    {name: 'state', path: '/state', children: simpleTabRoutes()},
                                    {name: 'dynamic', path: '/dynamic'},
                                    {
                                        name: 'routing',
                                        path: '/routing',
                                        children: [
                                            {name: 'people', path: '/people?item'},
                                            {name: 'places', path: '/places?item'}
                                        ]
                                    },
                                    {name: 'error', path: '/error'}
                                ]
                            },
                            {name: 'dock', path: '/dock'},
                            {name: 'tileFrame', path: '/tileFrame'},
                            {name: 'dashContainer', path: '/dashContainer'},
                            {name: 'dashCanvas', path: '/dashCanvas'}
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
                            {name: 'columnChooser', path: '/columnChooser'},
                            {name: 'filterChooser', path: '/filterChooser'},
                            {name: 'gridFindField', path: '/gridFindField'},
                            {name: 'groupingChooser', path: '/groupingChooser'},
                            {name: 'storeFilterField', path: '/storeFilterField'}
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
                            {name: 'radioCardInput', path: '/radioCardInput'},
                            {name: 'toggles', path: '/toggles'},
                            {name: 'slider', path: '/slider'},
                            {name: 'intentInput', path: '/intentInput'},
                            {name: 'iconPicker', path: '/iconPicker'},
                            {name: 'codeInputs', path: '/codeInputs'}
                        ]
                    },
                    {
                        name: 'components',
                        path: '/components',
                        children: [
                            {name: 'ohlc', path: '/ohlc'},
                            {name: 'line', path: '/line'},
                            {name: 'simpleTreeMap', path: '/simpleTreeMap'},
                            {name: 'gridTreeMap', path: '/gridTreeMap'},
                            {name: 'splitTreeMap', path: '/splitTreeMap'},
                            {name: 'buttons', path: '/buttons'},
                            {name: 'errorMessage', path: '/errorMessage'},
                            {name: 'icons', path: '/icons'},
                            {name: 'markdown', path: '/markdown'},
                            {name: 'dateRangePicker', path: '/dateRangePicker'},
                            {name: 'leftRightChooser', path: '/leftRightChooser'},
                            {name: 'fileChooser', path: '/fileChooser'},
                            {name: 'clock', path: '/clock'},
                            {name: 'pinPad', path: '/pinPad'},
                            {name: 'timestamp', path: '/timestamp'},
                            {name: 'placeholder', path: '/placeholder'}
                        ]
                    },
                    {
                        name: 'mobile',
                        path: '/mobile'
                    },
                    {
                        name: 'system',
                        path: '/system',
                        children: [
                            {name: 'banners', path: '/banners'},
                            {name: 'updatesIdle', path: '/updatesIdle'},
                            {name: 'appOptions', path: '/appOptions'},
                            {name: 'customPackage', path: '/customPackage'},
                            {name: 'exceptionHandler', path: '/exceptionHandler'},
                            {name: 'formatDates', path: '/formatDates'},
                            {name: 'formatNumbers', path: '/formatNumbers'},
                            {name: 'inspector', path: '/inspector'},
                            {name: 'jsx', path: '/jsx'},
                            {name: 'messages', path: '/messages'},
                            {
                                name: 'simpleRouting',
                                path: '/simpleRouting',
                                children: [{name: 'recordId', path: '/:recordId'}]
                            },
                            {name: 'toast', path: '/toast'}
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
                label: span(githubIcon(), 'Last Commit'),
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
                    switcher: {
                        ...switcher,
                        groups: [
                            {key: 'grid', title: 'Grid'},
                            {key: 'variants', title: 'Grid Variants'},
                            {key: 'helpers', title: 'Grid Helpers'}
                        ]
                    },
                    tabs: [
                        ...[
                            {id: 'standard', content: standardGridPanel},
                            {id: 'tree', content: treeGridPanel},
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
                            {
                                id: 'columnChooser',
                                title: 'Column Chooser',
                                content: columnChooserPanel
                            },
                            {id: 'columnFiltering', content: columnFilteringPanel},
                            {id: 'inlineEditing', content: inlineEditingPanel},
                            {id: 'externalSort', content: externalSortGridPanel}
                        ].map(it => ({...it, group: 'grid'})),
                        // Components built on or around GridModel, each with its own API.
                        ...[
                            {id: 'zoneGrid', title: 'Zone Grid', content: zoneGridPanel},
                            {id: 'dataview', title: 'DataView', content: dataViewPanel},
                            {id: 'rest', title: 'REST Editor', content: restGridPanel},
                            {id: 'agGrid', title: 'AG Grid Wrapper', content: agGridView}
                        ].map(it => ({...it, group: 'variants'})),
                        // Controls that sit beside a grid to filter, group, or search its data.
                        ...[
                            {
                                id: 'filterChooser',
                                title: 'FilterChooser',
                                content: filterChooserPanel
                            },
                            {
                                id: 'gridFindField',
                                title: 'GridFindField',
                                content: gridFindFieldPanel
                            },
                            {
                                id: 'groupingChooser',
                                title: 'GroupingChooser',
                                content: groupingChooserPanel
                            },
                            {
                                id: 'storeFilterField',
                                title: 'StoreFilterField',
                                content: storeFilterFieldPanel
                            }
                        ].map(it => ({...it, group: 'helpers'}))
                    ]
                }
            },
            {
                id: 'layout',
                icon: Icon.layout(),
                content: {
                    switcher: {
                        ...switcher,
                        groups: [
                            {key: 'panels', title: 'Panels'},
                            {key: 'containers', title: 'Containers'},
                            {key: 'dashboards', title: 'Dashboards'}
                        ]
                    },
                    tabs: [
                        ...[
                            {id: 'intro', content: basicPanel},
                            {id: 'toolbars', content: toolbarPanel},
                            {id: 'sizing', content: panelSizingPanel},
                            {id: 'mask', content: maskPanel},
                            {id: 'loadingIndicator', content: loadingIndicatorPanel},
                            {id: 'banner', content: bannerPanel}
                        ].map(it => ({...it, group: 'panels'})),
                        ...[
                            {id: 'hbox', title: 'HBox', content: hboxContainerPanel},
                            {id: 'vbox', title: 'VBox', content: vboxContainerPanel},
                            {id: 'card', title: 'Card', content: cardPanel},
                            {
                                id: 'tabPanel',
                                title: 'TabContainer',
                                content: tabPanelContainerPanel
                            },
                            {id: 'dock', title: 'DockContainer', content: dockContainerPanel},
                            {id: 'tileFrame', title: 'TileFrame', content: tileFrameContainerPanel}
                        ].map(it => ({...it, group: 'containers'})),
                        ...[
                            {
                                id: 'dashContainer',
                                title: 'DashContainer',
                                content: dashContainerPanel
                            },
                            {id: 'dashCanvas', title: 'DashCanvas', content: dashCanvasPanel}
                        ].map(it => ({...it, group: 'dashboards'}))
                    ]
                }
            },
            {
                id: 'forms',
                title: 'Forms + Inputs',
                icon: Icon.edit(),
                content: {
                    switcher: {
                        ...switcher,
                        groups: [
                            {key: 'forms', title: 'Forms'},
                            {key: 'inputs', title: 'All Inputs'}
                        ]
                    },
                    // Concepts first, then the All Inputs index and one page per input.
                    tabs: [
                        {id: 'form', title: 'FormModel', group: 'forms', content: formPanel},
                        {
                            id: 'toolbarForms',
                            title: 'Forms in Toolbars',
                            group: 'forms',
                            content: toolbarFormPanel
                        },
                        ...[
                            {
                                id: 'inputs',
                                title: 'Overview',
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
                            {
                                id: 'radioCardInput',
                                title: 'RadioCardInput',
                                content: radioCardInputPanel
                            },
                            {id: 'toggles', title: 'Checkbox & Switch', content: togglesPanel},
                            {id: 'slider', title: 'Slider', content: sliderPanel},
                            {id: 'intentInput', title: 'IntentInput', content: intentInputPanel},
                            {id: 'iconPicker', title: 'IconPicker', content: iconPickerPanel},
                            {id: 'codeInputs', title: 'JsonInput & Code', content: codeInputsPanel}
                        ].map(it => ({...it, group: 'inputs'}))
                    ]
                }
            },
            {
                id: 'components',
                icon: Icon.cube(),
                content: {
                    switcher: {
                        ...switcher,
                        groups: [
                            {key: 'general', title: 'General'},
                            {key: 'charts', title: 'Charts'},
                            {key: 'choosers', title: 'Choosers & Pickers'}
                        ]
                    },
                    tabs: [
                        ...[
                            {id: 'buttons', content: buttonsPanel},
                            {id: 'clock', content: clockPanel},
                            {id: 'errorMessage', title: 'ErrorMessage', content: errorMessagePanel},
                            {id: 'icons', content: iconsPanel},
                            {id: 'markdown', content: markdownPanel},
                            {id: 'pinPad', title: 'PIN Pad', content: pinPadPanel},
                            {id: 'placeholder', title: 'Placeholder', content: placeholderPanel},
                            {id: 'timestamp', content: relativeTimestampPanel}
                        ].map(it => ({...it, group: 'general'})),
                        ...[
                            {id: 'line', content: lineChartPanel},
                            {id: 'ohlc', title: 'OHLC', content: ohlcChartPanel},
                            {id: 'simpleTreeMap', title: 'TreeMap', content: simpleTreeMapPanel},
                            {id: 'gridTreeMap', title: 'Grid TreeMap', content: gridTreeMapPanel},
                            {id: 'splitTreeMap', title: 'Split TreeMap', content: splitTreeMapPanel}
                        ].map(it => ({...it, group: 'charts'})),
                        ...[
                            {
                                id: 'dateRangePicker',
                                title: 'DateRangePicker',
                                content: dateRangePickerPanel
                            },
                            {id: 'fileChooser', title: 'FileChooser', content: fileChooserPanel},
                            {
                                id: 'leftRightChooser',
                                title: 'LeftRightChooser',
                                content: leftRightChooserPanel
                            }
                        ].map(it => ({...it, group: 'choosers'}))
                    ]
                }
            },
            {id: 'mobile', icon: Icon.mobile(), content: mobileTab},
            {
                id: 'system',
                icon: Icon.boxFull(),
                content: {
                    switcher: {
                        ...switcher,
                        groups: [
                            {key: 'concepts', title: 'Concepts'},
                            {key: 'dialogs', title: 'Dialogs & Alerts'},
                            {key: 'format', title: 'Formatting'}
                        ]
                    },
                    tabs: [
                        ...[
                            {id: 'appOptions', title: 'App Options', content: appOptionsPanel},
                            {id: 'customPackage', content: customPackagePanel},
                            {
                                id: 'exceptionHandler',
                                title: 'Exception Handling',
                                content: exceptionHandlerPanel
                            },
                            {id: 'jsx', title: 'Factories vs. JSX', content: jsxPanel},
                            {id: 'inspector', content: inspectorPanel},
                            {id: 'simpleRouting', content: simpleRoutingPanel},
                            {
                                id: 'updatesIdle',
                                title: 'Updates & Idle',
                                content: appNotificationsPanel
                            }
                        ].map(it => ({...it, group: 'concepts'})),
                        ...[
                            {id: 'banners', content: bannersPanel},
                            {id: 'messages', content: messagesPanel},
                            {id: 'toast', content: toastPanel}
                        ].map(it => ({...it, group: 'dialogs'})),
                        ...[
                            {id: 'formatDates', content: dateFormatsPanel},
                            {id: 'formatNumbers', content: numberFormatsPanel}
                        ].map(it => ({...it, group: 'format'}))
                    ]
                }
            },
            {id: 'docs', icon: Icon.book(), content: docsTab},
            {id: 'examples', title: 'Example Apps', icon: Icon.boxFull(), content: examplesTab}
        ];
        // Shared by `initialFavorites` and "Restore Defaults" menu item for consistent reset
        const defaultFavoriteTabIds = tabs.map(it => it.id);

        return new TabContainerModel({
            persistWith: {localStorageKey: 'tabStateV2'},
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
