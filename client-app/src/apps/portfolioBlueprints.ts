import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {BlueprintAppComponent} from '../blueprints/app/BlueprintApp';
import {AuthModel} from '../core/AuthModel';
import {AppModel} from '../examples/portfolioBlueprints/AppModel';

XH.renderApp({
    clientAppCode: 'portfolioBlueprints',
    clientAppName: 'XH Portfolio Blueprints',
    componentClass: BlueprintAppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    isMobileApp: false,
    enableLogout: true,
    showBrowserContextMenu: true,
    checkAccess: () => true
});
