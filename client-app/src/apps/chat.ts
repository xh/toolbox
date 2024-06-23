import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/chat/AppComponent';
import {AppModel} from '../examples/chat/AppModel';

XH.renderApp({
    clientAppCode: 'chat',
    clientAppName: 'ChatGPT Labs',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    checkAccess: 'CHAT_GPT_USER'
});
