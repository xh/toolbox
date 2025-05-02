import {HoistAuthModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {AuthZeroClient, AuthZeroClientConfig} from '@xh/hoist/security/authzero';
import {MsalClient, MsalClientConfig} from '@xh/hoist/security/msal';

/**
 * Toolbox's implementation of {@link HoistAuthModel} contract for handling authentication.
 *
 * This example is atypical of most application implementations in that it supports a fallback
 * option for local username/password login, for offline or other local testing scenarios where
 * OAuth is undesired, as well as flows against either Auth0 (default) or Azure Entra ID.
 */
export class AuthModel extends HoistAuthModel {
    @managed
    client: AuthZeroClient | MsalClient;

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

        // Otherwise proceed with the primary OAuth flow by constructing and initializing one of the two
        // supported client implementations - either Auth0 (default) or MSAL (also supported, for testing OAuth
        // against Microsoft Entra ID).
        this.client = this.createClient(config);
        await this.client.initAsync();

        // With the client initialized, we tell FetchService to pass the ID token (a JWT) via a custom
        // header on any local/relative requests going back to Toolbox Grails server.
        XH.fetchService.addDefaultHeaders(async opts => {
            if (opts.url.startsWith('http')) return null;

            try {
                const idToken = await this.client.getIdTokenAsync();
                return {Authorization: `Bearer ${idToken.value}`};
            } catch (e) {
                XH.suspendApp({
                    message:
                        'Your authentication has expired and you have been logged out of the app.' +
                        'Please reload now to continue.',
                    reason: 'AUTH_EXPIRED'
                });
            }
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

    private createClient(config: PlainObject): AuthZeroClient | MsalClient {
        if (config.provider === 'AUTH_ZERO') {
            const audience = 'toolbox.xh.io';
            return new AuthZeroClient({
                idScopes: ['profile'],
                // Toolbox does not actually need any access tokens -- just a test
                accessTokens: {
                    test: {
                        scopes: ['profile'],
                        fetchMode: 'eager',
                        audience
                    }
                },
                // This config works along with the accessToken requested above - by passing the same
                // audience to our interactive login requests, they return access/refresh tokens that
                // are immediately usable.
                audience,
                ...(config as AuthZeroClientConfig)
            });
        } else {
            return new MsalClient(config as MsalClientConfig);
        }
    }

    // Update overall load mask message to provide an indication that this auth flow is processing.
    private setMaskMsg(msg: string) {
        XH.appContainerModel.initializingLoadMaskMessage = msg;
    }
}
