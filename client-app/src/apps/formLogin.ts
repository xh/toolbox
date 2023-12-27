import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppComponent} from '../examples/formLogin/AppComponent';
import {AppModel} from '../examples/formLogin/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';

//------------------------------------------------------------------------------------
// A simple non-sso app to both show support for Hoist's forms-based login,
// and to allow logging in without auth0 for bootstrapping/troubleshooting purposes.
//------------------------------------------------------------------------------------
XH.renderApp({
    clientAppCode: 'formLogin',
    clientAppName: 'Form-Based Login',
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    isMobileApp: false,
    isSSO: false,
    checkAccess: () => true,
    loginMessage: 'Use this form to bypass Auth0 and login with any known username and password.',
    lockoutMessage: 'Please contact support@xh.io if you need help configuring authentication.'
});
