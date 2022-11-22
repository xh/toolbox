import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';

export const App = {
    get model()          {return XH.appModel as AppModel},
    get oauthService()   {return XH.getService(OauthService)}
};

export class AppModel extends HoistAppModel {

    static instance: AppModel;

    static override async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async logoutAsync() {
        await App.oauthService.logoutAsync();
    }

}
