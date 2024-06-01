import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/recalls/AppComponent';
import {AppModel} from '../examples/recalls/AppModel';

XH.renderApp({
    clientAppCode: 'recalls',
    clientAppName: 'FDA Recalls',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    enableLogout: true,
    checkAccess: () => true
});
