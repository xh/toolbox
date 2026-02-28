import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/weatherv2/AppComponent';
import {AppModel} from '../examples/weatherv2/AppModel';
import {AuthModel} from '../core/AuthModel';

XH.renderApp({
    clientAppCode: 'weatherv2',
    clientAppName: 'XH Weather V2',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    isMobileApp: false,
    enableLogout: true,
    showBrowserContextMenu: true,
    checkAccess: () => true
});
