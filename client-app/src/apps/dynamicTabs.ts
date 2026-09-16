import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/dynamicTabs/AppComponent';
import {AppModel} from '../examples/dynamicTabs/AppModel';
import {AuthModel} from '../core/AuthModel';

XH.renderApp({
    clientAppCode: 'dynamicTabs',
    clientAppName: 'Dynamic Routable Tabs',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    isMobileApp: false,
    enableLogout: true,
    checkAccess: () => true
});
