import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {App} from '../examples/contact/App';
import {AppModel} from '../examples/contact/AppModel';

XH.renderApp({
    clientAppCode: 'contact',
    clientAppName: 'XH Contact',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    checkAccess: 'APP_READER'
});