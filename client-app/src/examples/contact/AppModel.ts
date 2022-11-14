import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {ContactService} from './svc/ContactService';

export const PERSIST_APP = {prefKey: 'contactAppState'};

export const App = {
    get model()          {return XH.appModel as AppModel},
    get oauthService()   {return XH.getService(OauthService)},
    get contactService() {return XH.getService(ContactService)}
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