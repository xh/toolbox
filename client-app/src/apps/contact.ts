import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/contact/AppComponent';
import {AppModel} from '../examples/contact/AppModel';

XH.renderApp({
    clientAppCode: 'contact',
    clientAppName: 'XH Contact',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    enableLogout: true,
    checkAccess: () => true
});
