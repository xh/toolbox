import createAuth0Client from '@auth0/auth0-spa-js';
import {HoistService, XH} from '@xh/hoist/core';

@HoistService
export class OauthService {

    auth0;

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

        if (!isAuthenticated) {
            try {
                // TODO - auth0 throws if this is called when we are *not* handling a redirect -
                //      could look @ query params to determine if we should even try.
                const redirectResult = await auth0.handleRedirectCallback();
                console.log('redirectResult', redirectResult);
                isAuthenticated = await this.checkAuthAsync();
                console.log('isAuthenticated | post redirect handle', isAuthenticated);
            } catch (e) {
                console.log(`Caught while attempting to get redirectResults`, e);
            }

            if (!isAuthenticated) {
                console.log(`Not authenticated - logging in....`);
                await auth0.loginWithRedirect();
            }
        }

        isAuthenticated = await this.checkAuthAsync();
        if (isAuthenticated) {
            console.log(`Authenticated OK | getting user + tokens`);
            await this.getUserAsync();
            await this.getTokenAsync();
        } else {
            console.error('Did NOT authenticate.');
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

}