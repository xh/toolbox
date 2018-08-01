/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {XH, HoistApp} from '@xh/hoist/core';
import {NavigatorModel} from '@xh/hoist/mobile/cmp/navigator';
import {AppMenuModel} from '@xh/hoist/mobile/cmp/header';
import {Icon} from '@xh/hoist/icon';

import {AppContainer} from '@xh/hoist/mobile/appcontainer';
import {AppComponent} from './AppComponent';

import {homePage} from './home/HomePage';
import {gridPage} from './grids/GridPage';
import {iconPage} from './icons/IconPage';

@HoistApp
class AppClass {

    navigatorModel = null;
    appMenuModel = null;

    get isMobile() {return true}
    get componentClass() {return AppComponent}
    get containerClass() {return AppContainer}
    get enableLogout() {return true}

    checkAccess(user) {
        const role = 'APP_READER',
            hasAccess = user.hasRole(role),
            message = hasAccess ? '' : `Role "${role}" is required to use this application.`;

        return {hasAccess, message};
    }

    constructor() {
        this.appMenuModel = new AppMenuModel({
            itemModels: [
                {
                    icon: Icon.grid({prefix: 'fal'}),
                    text: 'Grids',
                    action: () => this.navigate('Grids', gridPage)
                },
                {
                    icon: Icon.edit(),
                    text: 'Icons',
                    action: () => this.navigate('Icons', iconPage)
                }
            ]
        });
        this.navigatorModel = new NavigatorModel({
            pageFactory: homePage,
            title: 'Toolbox'
        });
    }

    navigate(title, pageFactory) {
        this.navigatorModel.pushPage({title, pageFactory});
    }

    async initAsync() {
        XH.track({msg: 'Loaded Mobile App'});
    }

    destroy() {
        XH.safeDestroy(this.appMenuModel);
        XH.safeDestroy(this.navigatorModel);
    }

}
export const App = new AppClass();