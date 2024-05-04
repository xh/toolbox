import {HoistAppModel, XH} from '@xh/hoist/core';
import {AuthZeroOauthService} from '@xh/hoist/security/auth0/AuthZeroOauthService';

export class BaseAppModel extends HoistAppModel {
    static override async preAuthAsync() {
        await XH.installServicesAsync(AuthZeroOauthService);
    }

    override async logoutAsync() {
        return XH.authZeroOauthService.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }
}
