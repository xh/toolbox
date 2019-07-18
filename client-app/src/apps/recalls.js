import {XH} from '@xh/hoist/core';
import {App} from '../examples/recalls/App';
import {AppModel} from '../examples/recalls/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

XH.renderApp({
    clientAppCode: 'recalls',
    clientAppName: 'Recalls',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobile: false,
    isSSO: false,
    idleDetectionEnabled: true,
    checkAccess: 'APP_READER',
    loginMessage: "User: 'toolbox@xh.io' / Password: 'toolbox'"
});
