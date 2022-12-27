import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {ContactService} from './svc/ContactService';

export const PERSIST_APP = {prefKey: 'contactAppState'};


export class AppModel extends HoistAppModel {

    static instance: AppModel;


    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async initAsync() {
        await XH.installServicesAsync(ContactService);
    }

    async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }
}