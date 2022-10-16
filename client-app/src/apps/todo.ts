import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {App} from '../examples/todo/App';
import {AppModel} from '../examples/todo/AppModel';

export const AM = await XH.renderApp({
    clientAppCode: 'todo',
    clientAppName: 'Todo',
    componentClass: App,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    checkAccess: 'APP_READER'
});
