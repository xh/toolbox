import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../desktop/AppComponent';
import {AppModel} from '../desktop/AppModel';

await XH.renderApp({
    clientAppCode: 'app',
    clientAppName: 'Toolbox',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    webSocketsEnabled: true,
    checkAccess: 'APP_READER'
});
