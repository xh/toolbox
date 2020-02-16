import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {guestUserLoginMsg} from '../core/guestUserLoginMsg';
import {App} from '../examples/recalls/App';
import {AppModel} from '../examples/recalls/AppModel';

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
    loginMessage: guestUserLoginMsg
});
