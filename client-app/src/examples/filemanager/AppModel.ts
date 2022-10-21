import {HoistAppModel, initServicesAsync} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';

export class AppModel extends HoistAppModel {

    static oauthService: OauthService;

    static override async preAuthAsync() {
        await initServicesAsync(OauthService, this);
    }

    override async logoutAsync() {
        await AppModel.oauthService.logoutAsync();
    }

}
