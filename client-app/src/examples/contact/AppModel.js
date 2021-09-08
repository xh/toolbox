import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {ContactService} from './svc/ContactService';


export const PERSIST_APP = {prefKey: 'contactAppState'};

export class AppModel extends HoistAppModel {

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    async initAsync() {
        await XH.installServicesAsync(ContactService);
    }

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

}

/**
 * @typedef XH
 * @property {ContactService} contactService
 * @property {OauthService} oauthService
 */
