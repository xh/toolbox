import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {ChatSources} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {AppComponent} from '../examples/chatkit/AppComponent';
import {AppModel} from '../examples/chatkit/AppModel';
import {AuthModel} from '../core/AuthModel';

// TEMP - preview the roomy sources layout, until the demo playground has a toggle for it.
ChatSources.defaults.compact = false;

XH.renderApp({
    clientAppCode: 'chatkit',
    clientAppName: 'XH Chat Kit',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    isMobileApp: false,
    enableLogout: true,
    showBrowserContextMenu: true,
    checkAccess: () => true
});
