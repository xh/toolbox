import {XH} from '@xh/hoist/core';
import {App} from '../desktop/App';
import {AppModel} from '../desktop/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

XH.renderApp({
    clientAppName: 'Toolbox',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobile: false,
    isSSO: false,
    idleDetectionEnabled: true,
    checkAccess: 'APP_READER',
    loginMessage: "User: 'toolbox@xh.io' / Password: 'toolbox'"
});
