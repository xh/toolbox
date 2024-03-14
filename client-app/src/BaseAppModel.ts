import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from './core/svc/OauthService';

export class BaseAppModel extends HoistAppModel {
    static override async preAuthAsync() {
        if (!(await BaseAppModel.shouldSkipOAuth())) {
            await XH.installServicesAsync(OauthService);
        }
    }

    override async logoutAsync() {
        if (XH.oauthService) {
            await XH.oauthService.logoutAsync();
        }
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }

    /*
     Skip OAuth if running in development mode, and we've already authenticated from the bootstrap login
     or if the hostname isn't included in the whitelist.
     This is to prevent the UI from redirecting to the Auth0 login page.
    */
    static async shouldSkipOAuth(): Promise<boolean> {
        const whitelist: string[] = ['toolbox.xh.io', 'toolbox-dev.xh.io', 'localhost'];
        const isSessionActiveOnDev: boolean = XH.isDevelopmentMode
            ? await XH.fetchService
                  .fetchJson({
                      url: 'xh/authStatus'
                  })
                  .then(r => r.authenticated)
                  .catch(() => false)
            : false;
        return isSessionActiveOnDev || !whitelist.includes(window.location.hostname);
    }
}
