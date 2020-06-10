import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {guestUserLoginMsg} from '../core/guestUserLoginMsg';
import {App} from '../examples/news/App';
import {AppModel} from '../examples/news/AppModel';

XH.renderApp({
    clientAppCode: 'news',
    clientAppName: 'XH News Feed',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: false,
    checkAccess: 'APP_READER',
    loginMessage: guestUserLoginMsg
});
