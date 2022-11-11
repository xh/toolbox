import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {ContactService} from './svc/ContactService';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export const App = {
    get model() {return AppModel.instance},
    get oauthService() {return OauthService.instance},
    get contactService() {return ContactService.instance}
};

export class AppModel extends HoistAppModel {

    static instance: AppModel;

    static async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async initAsync() {
        await XH.installServicesAsync(ContactService);
    }

    async logoutAsync() {
        await App.oauthService.logoutAsync();
    }
}