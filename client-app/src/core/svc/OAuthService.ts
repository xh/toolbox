import {HoistService, managed, XH} from '@xh/hoist/core';
import {AuthZeroClient} from '@xh/hoist/security/auth0/AuthZeroClient';

export class OAuthService extends HoistService {
    static instance: OAuthService;

    @managed
    client = new AuthZeroClient({
        loginMethodDesktop: 'REDIRECT',
        scopes: ['user.read']
    });

    override async initAsync() {
        const {client} = this;
        await client.initAsync();

        // Add id token to headers for any *local* urls going back to grails server.
        XH.fetchService.addDefaultHeaders(opts => {
            const {idToken} = client;
            return !opts.url.startsWith('http') && idToken ? {'x-xh-idt': idToken} : null;
        });
    }

    async logoutAsync() {
        this.client.logoutAsync();
    }
}
