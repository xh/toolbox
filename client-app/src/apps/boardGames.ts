import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/boardGames/AppComponent';
import {AppModel} from '../examples/boardGames/AppModel';
import {AuthModel} from '../core/AuthModel';

XH.renderApp({
    clientAppCode: 'boardGames',
    clientAppName: 'Board Games',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    isMobileApp: false,
    enableLogout: true,
    checkAccess: () => true
});
