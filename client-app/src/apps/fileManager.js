import {XH} from '@xh/hoist/core';
import {App} from '../examples/filemanager/App';
import {AppModel} from '../examples/recalls/AppModel';
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
    loginMessage: "User: 'admin@xh.io' / Contact us for Access"
});
