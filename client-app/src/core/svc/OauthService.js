import createAuth0Client from '@auth0/auth0-spa-js';
import {HoistService, XH} from '@xh/hoist/core';
import {never} from '@xh/hoist/promise';

@HoistService
export class OauthService {

    auth0;
    user;
    token;

    config = {
        domain: 'xhio.us.auth0.com',
        client_id: 'MUn9VrAGavF7n39RdhFYq8xkZkoFYEDB'
    }

    async initAsync() {
        const auth0 = this.auth0 = await createAuth0Client({
            ...this.config,
            redirect_uri: `${window.location.origin}/${XH.clientAppCode}/`
        });

        let isAuthenticated = await this.checkAuthAsync();
        console.log('isAuthenticated | initial check', isAuthenticated);

        // Presence of query params used here as an indicator that we *might* be returning from
        // an Auth0 redirect. Safely call handler to see if we have had a successful auth.
        if (!isAuthenticated && window.location.search) {
            try {
                const redirectResult = await auth0.handleRedirectCallback();
                console.debug('redirectResult', redirectResult);
                isAuthenticated = await this.checkAuthAsync();
                console.debug('isAuthenticated | post redirect handle', isAuthenticated);
            } catch (e) {
                console.log(`Caught while attempting to get redirectResults`, e);
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
            this.user = await this.getUserAsync();
            this.token = await this.getTokenAsync();
            console.log(`Authenticated OK | token: ${this.token} | user`, this.user);
            this.installDefaultFetchServiceHeaders();
        }
    }

    async getUserAsync() {
        const user = await this.auth0.getUser();
        console.log('user', user);
        return user;
    }

    async getTokenAsync() {
        const token = await this.auth0.getTokenSilently();
        console.log(`token`, token);
        return token;
    }

    async checkAuthAsync() {
        return await this.auth0.isAuthenticated();
    }

    async logoutAsync() {
        return this.auth0.logout({returnTo: 'https://xh.io'});
    }

    installDefaultFetchServiceHeaders() {
        XH.fetchService.setDefaultHeaders((opts) => {
            const {token} = this,
                relativeHoistUrl = !opts.url.startsWith('http');

            // Send XH ID token headers for requests to the Hoist server only - used to identify
            // our Hoist User via handling in server-side AuthenticationService.
            return relativeHoistUrl ? {'x-xh-idt': token} : {};
        });
    }

}