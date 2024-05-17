import {HoistService, managed, PlainObject, XH} from '@xh/hoist/core';
import {AuthZeroClient, AuthZeroClientConfig} from '@xh/hoist/security/authzero/AuthZeroClient';

export class AuthService extends HoistService {
    static instance: AuthService;

    @managed
    client: AuthZeroClient;

    override async initAsync() {
        const config: PlainObject = await XH.fetchService.getJson({url: 'xh/authConfig'});
        if (!config.useOAuth) {
            XH.appSpec.enableLoginForm = true;
            return;
        }

        this.client = new AuthZeroClient({
            idScopes: ['profile'],
            expiryWarning: true,
            ...(config as AuthZeroClientConfig)
        });
        await this.client.initAsync();

        // Add id token to headers for any *local* urls going back to grails server.
        XH.fetchService.addDefaultHeaders(opts => {
            const {idToken} = this.client;
            return !opts.url.startsWith('http') && idToken ? {'x-xh-idt': idToken} : null;
        });
    }

    async logoutAsync() {
        await this.client?.logoutAsync();
    }
}
