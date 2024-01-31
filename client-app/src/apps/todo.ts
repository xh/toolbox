import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/todo/AppComponent';
import {AppModel} from '../examples/todo/AppModel';

XH.renderApp({
    clientAppCode: 'todo',
    clientAppName: 'Todo',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    checkAccess: () => true
});
