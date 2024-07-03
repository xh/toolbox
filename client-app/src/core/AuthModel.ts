import {HoistAuthModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {AuthZeroClient, AuthZeroClientConfig} from '@xh/hoist/security/authzero/AuthZeroClient';
export class AuthModel extends HoistAuthModel {
    @managed
    client: AuthZeroClient;

    override async completeAuthAsync(): Promise<boolean> {
        const config: PlainObject = await this.loadConfigAsync();
        if (!config.useOAuth) {
            XH.appSpec.enableLoginForm = true;
            return this.getAuthStatusFromServerAsync();
        }

        this.client = new AuthZeroClient({
            idScopes: ['profile'],
            // Toolbox does not actually need any access tokens -- just a test
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

        return this.getAuthStatusFromServerAsync();
    }

    override async logoutAsync() {
        await super.logoutAsync();
        await this.client?.logoutAsync();
    }
}
