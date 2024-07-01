import '../Bootstrap';

import {XH} from '@xh/hoist/core';
import {AppComponent} from '@xh/hoist/admin/AppComponent';
import {AppModel} from '../admin/AppModel';
import {AppContainer} from '@xh/hoist/desktop/appcontainer';
import {AuthModel} from '../core/AuthModel';

XH.renderAdminApp({
    componentClass: AppComponent,
    modelClass: AppModel,
    containerClass: AppContainer,
    authModelClass: AuthModel,
    enableLogout: true,
    lockoutMessage: "Contact support@xh.io for information on Hoist's bundled Admin Console."
});
