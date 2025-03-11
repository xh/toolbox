import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/mobile/appcontainer';
import {AppComponent} from '../examples/contactMobile/AppComponent';
import {AppModel} from '../examples/contactMobile/AppModel';
import {AuthModel} from '../core/AuthModel';

XH.renderApp({
    clientAppCode: 'contactMobile',
    clientAppName: 'XH Contact Mobile',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    isMobileApp: true,
    enableLogout: true,
    checkAccess: () => true
});
