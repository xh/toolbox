import {XH} from '@xh/hoist/core';
import {App} from '../mobile/App';
import {AppModel} from '../mobile/AppModel';
import {AppContainer} from '@xh/hoist/mobile/appcontainer';

XH.renderApp({
    clientAppCode: 'mobile',
    clientAppName: 'Toolbox Mobile',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobile: true,
    isSSO: false,
    checkAccess: 'APP_READER',
    loginMessage: '👤 toolbox@xh.io + 🔐 toolbox'
});
