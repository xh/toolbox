import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';

export const PERSIST_APP = {localStorageKey: 'recallsAppState'};

export class AppModel extends HoistAppModel {

    static instance: AppModel;

    static override async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async logoutAsync() {
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
