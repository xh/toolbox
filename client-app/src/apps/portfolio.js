import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {guestUserLoginMsg} from '../core/guestUserLoginMsg';
import {App} from '../examples/portfolio/App';
import {AppModel} from '../examples/portfolio/AppModel';

XH.renderApp({
    clientAppCode: 'portfolio',
    clientAppName: 'XH Portfolio',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: false,
    webSocketsEnabled: true,
    checkAccess: 'APP_READER',
    loginMessage: guestUserLoginMsg
});
