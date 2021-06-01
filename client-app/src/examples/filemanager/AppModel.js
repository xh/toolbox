import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';

export class AppModel extends HoistAppModel {

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

}
