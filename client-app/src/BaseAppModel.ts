import {HoistAppModel, XH} from '@xh/hoist/core';
import {AuthZeroOauthService} from '@xh/hoist/svc/oauth/AuthZeroOauthService';

export class BaseAppModel extends HoistAppModel {
    static override async preAuthAsync() {
        await XH.installServicesAsync(AuthZeroOauthService);
    }

    override async logoutAsync() {
        XH.authZeroOauthService.enabled
            ? await XH.authZeroOauthService.logoutAsync()
            : await super.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }
}
