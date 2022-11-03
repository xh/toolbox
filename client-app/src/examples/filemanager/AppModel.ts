import {HoistAppModel, initServicesAsync} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {ContactService} from '../contact/svc/ContactService';

export let App: AppModel;

export class AppModel extends HoistAppModel {

    static oauthService: OauthService;

    static override async preAuthAsync() {
        await initServicesAsync(OauthService, this);
    }

    override async initAsync() {
        App = this;
        await this.initServicesAsync(ContactService);
    }

    override async logoutAsync() {
        await AppModel.oauthService.logoutAsync();
    }

}
