import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {guestUserLoginMsg} from '../core/guestUserLoginMsg';
import {App} from '../examples/news/App';
import {AppModel} from '../examples/news/AppModel';

XH.renderApp({
    clientAppCode: 'news',
    clientAppName: 'News Feed',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobile: false,
    isSSO: false,
    idleDetectionEnabled: true,
    checkAccess: 'APP_READER',
    loginMessage: guestUserLoginMsg
});
