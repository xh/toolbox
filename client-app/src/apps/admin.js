import {XH} from '@xh/hoist/core';

import {App} from '@xh/hoist/admin/App';
import {AppModel} from '@xh/hoist/admin/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

XH.renderApp({
    clientAppCode: 'admin',
    clientAppName: 'Toolbox Admin',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobile: false,
    isSSO: false,
    checkAccess: 'HOIST_ADMIN',
    loginMessage: 'Contact support@xh.io for information on Hoist\'s bundled Admin Console.',
    lockoutMessage: 'Contact support@xh.io for information on Hoist\'s bundled Admin Console.'
});