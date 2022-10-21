import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppComponent} from '../examples/filemanager/AppComponent';
import {AppModel} from '../examples/filemanager/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

export let App = XH.renderApp({
    clientAppCode: 'fileManager',
    clientAppName: 'XH File Manager',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: false,
    checkAccess: 'HOIST_ADMIN',
    loginMessage: 'Contact support@xh.io for information on this demo application.',
    lockoutMessage: 'Contact support@xh.io for information on this demo application.'
});
