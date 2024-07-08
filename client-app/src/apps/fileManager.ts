import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppComponent} from '../examples/filemanager/AppComponent';
import {AppModel} from '../examples/filemanager/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AuthModel} from '../core/AuthModel';

XH.renderApp({
    clientAppCode: 'fileManager',
    clientAppName: 'XH File Manager',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    isMobileApp: false,
    enableLogout: true,
    checkAccess: 'HOIST_ADMIN',
    loginMessage: 'Contact support@xh.io for information on this demo application.',
    lockoutMessage: 'Contact support@xh.io for information on this demo application.'
});
