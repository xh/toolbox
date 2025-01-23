import {HoistAuthModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {AuthZeroClient, AuthZeroClientConfig} from '@xh/hoist/security/authzero/AuthZeroClient';

/**
 * Toolbox uses Auth0 for OAuth authentication. Here we are overriding the base {@link HoistAuthModel} to load
 * OAuth-related soft-config from the Toolbox server, initialize an {@link AuthZeroClient} instance, kick-off the
 * Oauth flow, and setup default fetch headers to include an id token.
 */
export class AuthModel extends HoistAuthModel {
    @managed
    client: AuthZeroClient;

    override async completeAuthAsync(): Promise<boolean> {
        this.setMaskMsg('Authenticating...');

        // Toolbox's server-provided configuration allows for OAuth to be disabled entirely, falling back to a username
        // and password login. This is intended primarily for development scenarios - e.g. local mobile development
        // where you wish to load the app on a local IP that's not a valid redirect URL as per Auth0. Note that this
        // relies on the server-side Toolbox `User.groovy` class supporting a password-based login.
        const config: PlainObject = await this.loadConfigAsync();
        if (!config.useOAuth) {
            // If OAuth is disabled (the non-standard case), we enable forms-based login by mutating the appSpec,
            // then return the result of the server-based auth check - will be false if the user does not have an
            // active session, at which point the Hoist login form will be displayed.
            XH.appSpec.enableLoginForm = true;
            const ret = await this.getAuthStatusFromServerAsync();
            this.setMaskMsg(null);
            return ret;
        }

        // Otherwise we proceed with the primary OAuth flow by constructing and initializing an AuthZeroClient, one of
        // the OAuth implementations supported out-of-the-box by Hoist.
        const audience = 'toolbox.xh.io';
        this.client = new AuthZeroClient({
            idScopes: ['profile'],
            // Toolbox does not actually need any access tokens -- just a test
            accessTokens: {
                test: {scopes: ['profile'], audience}
            },
            // This config works along with the accessToken requested above - by passing the same
            // audience to our interactive login requests, they return access/refresh tokens that
            // are immediately usable.
            audience,
            ...(config as AuthZeroClientConfig)
        });
        await this.client.initAsync();

        // With the client initialized, we tell FetchService to pass the Auth0 supplied id token (a JWT) via a custom
        // header on any local/relative requests going back to Toolbox Grails server.
        XH.fetchService.addDefaultHeaders(async opts => {
            if (opts.url.startsWith('http')) return null;

            const idToken = await this.client.getIdTokenAsync();
            return idToken ? {'x-xh-idt': idToken.value} : null;
        });

        // Finally, make a request to check the auth-status on the server - that call will include the id token header
        // installed above, which will be read and validated by Toolbox's server-side implementation of
        // `AuthenticationService.completeAuthentication()`. Toolbox is unusual in that it is a deliberately open site
        // and will create an account on the fly for any new user, so we expect this request to always return true.
        const ret = await this.getAuthStatusFromServerAsync();
        this.setMaskMsg(null);
        return ret;
    }

    // This model's override calls the super implementation to clear the user's session on the Toolbox server, then
    // logs out of the Auth0 client to fully log them out.
    override async logoutAsync() {
        await super.logoutAsync();
        await this.client?.logoutAsync();
    }

    // Update overall load mask message to provide an indication that this auth flow is processing.
    private setMaskMsg(msg: string) {
        XH.appContainerModel.initializingLoadMaskMessage = msg;
    }
}
