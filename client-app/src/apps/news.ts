import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/news/AppComponent';
import {AppModel} from '../examples/news/AppModel';

XH.renderApp({
    clientAppCode: 'news',
    clientAppName: 'XH News',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    enableLogout: true,
    checkAccess: () => true
});
