import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../examples/weather/AppComponent';
import {AppModel} from '../examples/weather/AppModel';

XH.renderApp({
    clientAppCode: 'weather',
    clientAppName: 'Weather',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: true,
    checkAccess: 'APP_READER'
});
