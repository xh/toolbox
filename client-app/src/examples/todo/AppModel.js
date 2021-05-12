import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';

export const PERSIST_APP = {localStorageKey: 'todoAppState'};

export class AppModel extends HoistAppModel {

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async initAsync() {}

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

}
