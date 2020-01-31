/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistAppModel, loadAllAsync, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
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
import {roadmapDataView} from './tabs/roadmap/RoadmapDataView';


@HoistAppModel
export class AppModel {

    @managed
    tabModel = new TabContainerModel({
        route: 'default',
        tabs: [
            {id: 'home', icon: Icon.home(), content: homeTab},
            {id: 'grids', icon: Icon.grid(), content: gridsTab},
            {id: 'panels', icon: Icon.window(), content: panelsTab},
            {id: 'containers', icon: Icon.box(), content: containersTab},
            {id: 'forms', icon: Icon.edit(), content: formsTab},
            {id: 'charts', icon: Icon.chartLine(), content: chartsTab},
            {id: 'other', icon: Icon.boxFull(), content: otherTab},
            {id: 'examples', icon: Icon.books(), content: examplesTab},
            {id: 'roadmap', icon: Icon.mapSigns(), content: roadmapDataView}

        ],
        switcherPosition: 'none'
    });

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }

    constructor() {
        this.addReaction(this.trackTabReaction());
    }

    async initAsync() {
        await XH.installServicesAsync(
            PortfolioService
        );
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([], loadSpec);
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
                            {name: 'dash', path: '/dash'}
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
                        name: 'other',
                        path: '/other',
                        children: [
                            {name: 'clock', path: '/clock'},
                            {name: 'dateFormats', path: '/dateFormats'},
                            {name: 'fileChooser', path: '/fileChooser'},
                            {name: 'icons', path: '/icons'},
                            {name: 'jsx', path: '/jsx'},
                            {name: 'leftRightChooser', path: '/leftRightChooser'},
                            {name: 'numberFormats', path: '/numberFormats'},
                            {name: 'popups', path: '/popups'},
                            {name: 'timestamp', path: '/timestamp'}
                        ]
                    },
                    {
                        name: 'examples',
                        path: '/examples'
                    },
                    {
                        name: 'roadmap',
                        path: '/roadmap'

                    }
                ]
            }
        ];
    }

    trackTabReaction() {
        return {
            track: () => this.tabModel.activeTab,
            run: (activeTab) => {
                XH.track({category: 'Tab', message: `Viewed ${activeTab.title}`});
            }
        };
    }
}
