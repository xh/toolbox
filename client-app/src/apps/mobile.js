import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/mobile/appcontainer';
import {App} from '../mobile/App';
import {AppModel} from '../mobile/AppModel';

XH.renderApp({
    clientAppCode: 'mobile',
    clientAppName: 'Toolbox Mobile',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: true,
    isSSO: true,
    checkAccess: 'APP_READER'
});
