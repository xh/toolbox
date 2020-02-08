import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {guestUserLoginMsg} from '../core/guestUserLoginMsg';
import {App} from '../desktop/App';
import {AppModel} from '../desktop/AppModel';

XH.renderApp({
    clientAppCode: 'app',
    clientAppName: 'Toolbox',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobile: false,
    isSSO: false,
    webSocketsEnabled: true,
    idleDetectionEnabled: true,
    checkAccess: 'APP_READER',
    loginMessage: guestUserLoginMsg
});
