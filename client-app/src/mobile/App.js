/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {XH, HoistApp} from '@xh/hoist/core';

import {AppContainer} from '@xh/hoist/mobile/AppContainer';
import {AppComponent} from './AppComponent';

@HoistApp
class AppClass {

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
        XH.track({msg: 'Loaded Mobile App'});
    }
}
export const App = new AppClass();