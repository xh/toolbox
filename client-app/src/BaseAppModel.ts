import {HoistAppModel, XH} from '@xh/hoist/core';
import {OAuthService} from './core/svc/OAuthService';

export class BaseAppModel extends HoistAppModel {

    static override async preAuthAsync() {
        await XH.installServicesAsync(OAuthService);
    }

    override async logoutAsync() {
        return XH.oAuthService.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }
}
