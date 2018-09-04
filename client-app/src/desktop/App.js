/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {HoistApp, initServicesAsync, XH} from '@xh/hoist/core';
import {TabContainerModel} from '@xh/hoist/desktop/cmp/tab';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

import {CompanyService} from '../core/svc/CompanyService';
import {TradeService} from '../core/svc/TradeService';

import {AppComponent} from './AppComponent';
import {ChartsTab} from './tabs/charts/ChartsTab';
import {ContainersTab} from './tabs/containers/ContainersTab';
import {FormsTab} from './tabs/forms/FormsTab';
import {GridsTab} from './tabs/grids/GridsTab';
import {HomeTab} from './tabs/home/HomeTab';
import {IconsTab} from './tabs/icons/IconsTab';
import {OtherTab} from './tabs/other/OtherTab';
import {NewsTab} from "./tabs/news/NewsTab";
import {FeaturesTab} from "./tabs/news/FeaturesTab";

@HoistApp
class AppClass {

    tabModel = this.createTabModel();
    loginMessage = "User: 'toolbox@xh.io' / Password: 'toolbox'";

    companyService = new CompanyService();
    tradeService = new TradeService();

    get enableLogout() {return true}
    get componentClass() {return AppComponent}
    get containerClass() {return AppContainer}

    checkAccess(user) {
        const role = 'APP_READER',
            hasAccess = user.hasRole(role),
            message = hasAccess ? '' : `Role "${role}" is required to use this application.`;
        return {hasAccess, message};
    }

    async initAsync() {
        return initServicesAsync(
            this.companyService,
            this.tradeService
        ).then(() => {
            XH.track({msg: 'Loaded App'});
        });
    }

    getRoutes() {
        return [
            {
                name: 'default',
                path: '/app',
                forwardTo: 'default.home',
                children: [
                    {
                        name: 'home',
                        path: '/home'
                    },
                    {
                        name: 'containers',
                        path: '/containers',
                        forwardTo: 'default.containers.hbox',
                        children: [
                            {name: 'hbox', path: '/hbox'},
                            {name: 'vbox', path: '/vbox'},
                            {name: 'panel', path: '/panel'},
                            {name: 'tabPanel', path: '/tabPanel'},
                            {name: 'toolbar', path: '/toolbar'}
                        ]
                    },
                    {
                        name: 'grids',
                        path: '/grids',
                        forwardTo: 'default.grids.standard',
                        children: [
                            {name: 'standard', path: '/standard'},
                            {name: 'grouped', path: '/grouped'},
                            {name: 'rest', path: '/rest'},
                            {name: 'dataview', path: '/dataview'}
                        ]
                    },
                    {
                        name: 'forms',
                        path: '/forms'
                    },
                    {
                        name: 'charts',
                        path: '/charts',
                        forwardTo: 'default.charts.olhc',
                        children: [
                            {name: 'olhc', path: '/olhc'},
                            {name: 'line', path: '/line'}
                        ]
                    },
                    {
                        name: 'icons',
                        path: '/icons'
                    },
                    {
                        name: 'other',
                        path: '/other',
                        forwardTo: 'default.other.mask',
                        children: [
                            {name: 'mask', path: '/mask'},
                            {name: 'leftRightChooser', path: '/leftRightChooser'},
                            {name: 'timestamp', path: '/timestamp'},
                            {name: 'jsx', path: '/jsx'}
                        ]
                    },
                    {
                        name: 'features',
                        path: '/features',
                        forwardTo: 'default.features.news',
                        children: [
                            {name: 'news', path: '/news'}
                        ]
                    }
                ]
            }
        ];
    }

    createTabModel() {
        return new TabContainerModel({
            route: 'default',
            tabs: [
                {id: 'home', content: HomeTab},
                {id: 'containers', content: ContainersTab},
                {id: 'grids', content: GridsTab},
                {id: 'forms', content: FormsTab},
                {id: 'charts', content: ChartsTab},
                {id: 'icons', content: IconsTab},
                {id: 'other', content: OtherTab},
                {id: 'features', content: FeaturesTab}
            ]
        });
    }
}
export const App = new AppClass();