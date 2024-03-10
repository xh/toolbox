import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from './core/svc/OauthService';

export class BaseAppModel extends HoistAppModel {
    static override async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }
}
