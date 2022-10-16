import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {App} from '../examples/portfolio/App';
import {AppModel} from '../examples/portfolio/AppModel';

export let AM: AppModel;
XH.renderApp({
    clientAppCode: 'portfolio',
    clientAppName: 'Portfolio',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    webSocketsEnabled: true,
    checkAccess: 'APP_READER'
}).then(appModel => AM = appModel as AppModel);
