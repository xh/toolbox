import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {App} from '../examples/news/App';
import {AppModel} from '../examples/news/AppModel';

XH.renderApp({
    clientAppCode: 'news',
    clientAppName: 'XH News',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    checkAccess: 'APP_READER'
});
