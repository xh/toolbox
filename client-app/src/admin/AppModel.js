import {AppModel as HoistAdminAppModel} from '@xh/hoist/admin';
import {XH} from '@xh/hoist/core';

export class AppModel extends HoistAdminAppModel {

    checkAccess() {
        const role = 'HOIST_ADMIN',
            hasAccess = XH.getUser().hasRole(role),
            message = hasAccess ? '' : `Role "${role}" is required to use this application.`;
        return {hasAccess, message};
    }

    get enableLogout() {return true}

}