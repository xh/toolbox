import {HoistAppModel, initServicesAsync} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';

export const PERSIST_APP = {localStorageKey: 'recallsAppState'};

export class AppModel extends HoistAppModel {

    static oauthService: OauthService;

    static override async preAuthAsync() {
        await initServicesAsync(OauthService, this);
    }

    override async initAsync() {}

    override async logoutAsync() {
        await AppModel.oauthService.logoutAsync();
    }

}
