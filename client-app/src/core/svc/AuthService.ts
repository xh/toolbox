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
            // Toolbox does not actually need any access tokens,
            // but this tests the AuthZeroClient's ability to handle them.
            accessTokens: {
                test: {scopes: ['profile'], audience: 'toolbox.xh.io'}
            },
            ...(config as AuthZeroClientConfig)
        });
        await this.client.initAsync();

        // Add id token to headers for any *local* urls going back to grails server.
        XH.fetchService.addDefaultHeaders(async opts => {
            if (opts.url.startsWith('http')) return null;

            const idToken = await this.client.getIdTokenAsync();
            return idToken ? {'x-xh-idt': idToken.value} : null;
        });
    }

    async logoutAsync() {
        await this.client?.logoutAsync();
    }
}
