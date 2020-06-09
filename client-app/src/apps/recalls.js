import '../agGrid';
import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {guestUserLoginMsg} from '../core/guestUserLoginMsg';
import {App} from '../examples/recalls/App';
import {AppModel} from '../examples/recalls/AppModel';

XH.renderApp({
    clientAppCode: 'recalls',
    clientAppName: 'XH FDA Recalls',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: false,
    checkAccess: 'APP_READER',
    loginMessage: guestUserLoginMsg
});
