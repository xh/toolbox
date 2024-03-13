import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AppComponent} from '../bootstrapLogin/AppComponent';
import {AppModel} from '../bootstrapLogin/AppModel';

/*
    Navigate here for when OAuth doesn't behave as expected or for when you want to host the app on your device
    due to the device's IP not being whitelisted.
*/
XH.renderApp({
    clientAppCode: 'bootstrapApp',
    clientAppName: 'Toolbox Bootstrap Login',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: false,
    webSocketsEnabled: true,
    checkAccess: () => true,
    loginMessage: `This login is only for development when OAuth isn't acting as expected or for when hosting the app on
    your device. Use the Bootstrap Admin credentials set in your instance config file.`
});
