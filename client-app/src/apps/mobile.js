import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/mobile/appcontainer';
import {guestUserLoginMsg} from '../core/guestUserLoginMsg';
import {App} from '../mobile/App';
import {AppModel} from '../mobile/AppModel';

XH.renderApp({
    clientAppCode: 'mobile',
    clientAppName: 'Toolbox Mobile',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: true,
    isSSO: false,
    checkAccess: 'APP_READER',
    loginMessage: guestUserLoginMsg
});
