import {XH} from '@xh/hoist/core';
import {App} from '../examples/portfolio/App';
import {AppModel} from '../examples/portfolio/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

XH.renderApp({
    clientAppCode: 'portfolio',
    clientAppName: 'Portfolio',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobile: false,
    isSSO: false,
    idleDetectionEnabled: true,
    checkAccess: 'APP_READER',
    loginMessage: "User: 'toolbox@xh.io' / Password: 'toolbox'"
});
