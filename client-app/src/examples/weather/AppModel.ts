import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {LocationService} from './LocationService';

export const PERSIST_APP = {localStorageKey: 'todoAppState'};

export class AppModel extends HoistAppModel {
    static instance: AppModel;

    /**
     * TODO: Configure Oauth settings to allow use of this app
     */
    static override async preAuthAsync() {
      //  await XH.installServicesAsync(OauthService);
    }

    override async initAsync() {
      await XH.installServicesAsync(LocationService);
    }

    override async logoutAsync() {
       // await XH.oauthService.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }
}
