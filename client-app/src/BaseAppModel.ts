import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from './core/svc/OauthService';
import {MINUTES} from '@xh/hoist/utils/datetime';

export class BaseAppModel extends HoistAppModel {
    static override async preAuthAsync() {
        if (!(await BaseAppModel.isSessionActiveOnDev())) {
            await XH.installServicesAsync(OauthService);
        }
    }

    override async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }

    static async isSessionActiveOnDev(): Promise<boolean> {
        return XH.isDevelopmentMode
            ? XH.fetchService
                  .fetchJson({
                      url: 'xh/authStatus',
                      timeout: 3 * MINUTES // Accommodate delay for user at a credentials prompt
                  })
                  .then(r => r.authenticated)
                  .catch(() => false)
            : false;
    }
}
