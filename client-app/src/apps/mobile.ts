import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/mobile/appcontainer';
import {AppComponent} from '../mobile/AppComponent';
import {AppModel} from '../mobile/AppModel';
import {AuthModel} from '../core/AuthModel';

XH.renderApp({
    clientAppCode: 'mobile',
    clientAppName: 'Toolbox Mobile',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    webSocketsEnabled: true,
    isMobileApp: true,
    enableLogout: true,
    checkAccess: () => true
});
