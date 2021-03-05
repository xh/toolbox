import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';

export const PERSIST_APP = {localStorageKey: 'recallsAppState'};

export class AppModel extends HoistAppModel {

    get gridSizingMode() {
        return XH.getPref('gridSizingMode');
    }

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async initAsync() {}

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

}
