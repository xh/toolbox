import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {App} from '../examples/recalls/App';
import {AppModel} from '../examples/recalls/AppModel';

XH.renderApp({
    clientAppCode: 'recalls',
    clientAppName: 'FDA Recalls',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    checkAccess: 'APP_READER'
});
