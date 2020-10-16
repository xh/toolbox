import createAuth0Client from '@auth0/auth0-spa-js';
import {HoistService, XH} from '@xh/hoist/core';
import {never, wait} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';

@HoistService
export class OauthService {

    /** @member {Auth0Client} */
    auth0;
    /** @member {Object} - Authenticated user info as provided by Auth0 */
    user;
    /** @member {string} - Opaque Auth0 token - could be used to call e.g. their /userinfo API. */
    token;
    /** @member {string} - ID Token in JWT format - for passing to Hoist server. */
    idToken;

    /** @member {Object} - soft-config loaded from whitelisted endpoint on UI server. */
    config;

    async initAsync() {
        const config = this.config = await XH.fetchJson({
            url: 'oauthConfig'
        }).catchDefault();

        const auth0 = this.auth0 = await createAuth0Client({
            domain: config.domain,
            client_id: config.clientId,
            redirect_uri: `${window.location.origin}/${XH.clientAppCode}/`
        });

        let isAuthenticated = await this.checkAuthAsync();
        console.debug('isAuthenticated | initial check', isAuthenticated);

        // Presence of query params used here as an indicator that we *might* be returning from
        // an Auth0 redirect. Safely call handler to see if we have had a successful auth.
        const qString = window.location.search;
        if (!isAuthenticated && qString) {
            try {
                const redirectResult = await auth0.handleRedirectCallback();
                console.debug('redirectResult', redirectResult);
                isAuthenticated = await this.checkAuthAsync();
                console.debug('isAuthenticated | post redirect handle', isAuthenticated);

                // Remove Auth0 query string from URL - will be left otherwise if app does not
                // do any routing on its own.
                const cleanUrl = window.location.toString().replace(qString, '');
                window.history.replaceState({}, document.title, cleanUrl);
            } catch (e) {
                console.warn(`Caught while attempting to get redirectResults`, e);
            }
        }

        if (!isAuthenticated) {
            // If still not authenticated, we are either coming in fresh or were unable to confirm a
            // successful auth via redirect handler. Trigger interactive login.
            console.log(`Not authenticated - logging in....`);
            await auth0.loginWithRedirect();
            await never();
        } else {
            // Otherwise we should be able to ask Auth0 for user and token info.
            this.user = await this.auth0.getUser();
            this.token = await this.auth0.getTokenSilently();
            this.idToken = await this.getIdTokenAsync();

            console.log(`Authenticated OK | token: ${this.token} | user`, this.user);
            this.installDefaultFetchServiceHeaders();
        }
    }

    async getIdTokenAsync() {
        const claims = await this.auth0.getIdTokenClaims();
        return claims?.__raw;
    }

    async checkAuthAsync() {
        return this.auth0.isAuthenticated();
    }

    /**
     * Logout of both Hoist session and Auth0 Oauth session (if active).
     * @return {Promise<void>}
     */
    async logoutAsync() {
        try  {
            const hasOauth = await this.checkAuthAsync();
            if (hasOauth) {
                // Logout of Hoist session here, as the auth0 logout will redirect us away, so
                // calling code from XH.identityService won't get a chance to do the Hoist logout.
                // If we are NOT logged into Oauth for some reason, this will return and the
                // standard identityService logout flow will resume.
                await XH.fetchJson({url: 'xh/logout'});
                await this.auth0.logout({returnTo: 'https://xh.io'});
                // Wait enough time for Auth0 logout to redirect us away - if we return *too* soon
                // XH.identityService will reload the app first before Oauth logout complete.
                await wait(10 * SECONDS);
            }
        } catch (e) {
            console.error('Error during logout request', e);
        }
    }

    installDefaultFetchServiceHeaders() {
        XH.fetchService.setDefaultHeaders((opts) => {
            const {idToken} = this,
                relativeHoistUrl = !opts.url.startsWith('http');

            // Send XH ID token headers for requests to the Hoist server only - used to identify
            // our Hoist User via handling in server-side AuthenticationService.
            return relativeHoistUrl ? {'x-xh-idt': idToken} : {};
        });
    }

}
