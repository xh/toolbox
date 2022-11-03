import {HoistAppModel, initServicesAsync} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {ContactService} from './svc/ContactService';

export let App: AppModel;
export const PERSIST_APP = {prefKey: 'contactAppState'};

export class AppModel extends HoistAppModel {

    static oauthService: OauthService;
    contactService: ContactService;

    static async preAuthAsync() {
        await initServicesAsync(OauthService, this);
    }

    override async initAsync() {
        App = this;
        await this.initServicesAsync(ContactService);
    }

    async logoutAsync() {
        await AppModel.oauthService.logoutAsync();
    }
}