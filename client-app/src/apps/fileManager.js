import {XH} from '@xh/hoist/core';
import {App} from '../examples/filemanager/App';
import {AppModel} from '../examples/filemanager/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

XH.renderApp({
    clientAppCode: 'fileManager',
    clientAppName: 'File Manager',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobile: false,
    isSSO: false,
    idleDetectionEnabled: true,
    checkAccess: 'HOIST_ADMIN',
    loginMessage: 'Contact support@xh.io for information on this demo application.',
    lockoutMessage: 'Contact support@xh.io for information on this demo application.'
});
