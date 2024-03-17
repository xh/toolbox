import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppComponent} from '@xh/hoist/admin/AppComponent';
import {AppModel} from '../admin/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

XH.renderApp({
    clientAppCode: 'admin',
    clientAppName: 'Toolbox Admin',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    webSocketsEnabled: true,
    checkAccess: 'HOIST_ADMIN_READER',
    lockoutMessage: "Contact support@xh.io for information on Hoist's bundled Admin Console."
});
