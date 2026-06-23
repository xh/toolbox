package io.xh.toolbox.security

import io.xh.hoist.config.TypedConfigMap

/**
 * Typed representation of the `auth0Config` soft config - the OAuth client registration for Toolbox
 * at XH's Auth0 account (https://manage.auth0.com/dashboard/us/xhio/).
 *
 * Read server-side via `configService.getObject(Auth0Config)` and spread into the client config
 * payload by {@link AuthZeroTokenService}.
 */
class Auth0Config extends TypedConfigMap {

    /** OAuth client ID for the Toolbox application registered at Auth0. */
    String clientId = 'MUn9VrAGavF7n39RdhFYq8xkZkoFYEDB'

    /** Auth0 tenant domain used to build the issuer + JWKS URLs. */
    String domain = 'login.xh.io'

    /**
     * Additional options deep-merged into the underlying Auth0 client (hoist-react
     * `AuthZeroClientConfig.authZeroClientOptions`). Free-form `Partial<Auth0ClientOptions>` bag.
     */
    Map authZeroClientOptions = [useCookiesForTransactions: false]

    /**
     * Allow the client to re-login interactively (via pop-up) when tokens begin failing to load
     * (hoist-react `BaseOAuthClientConfig.reloginEnabled`).
     */
    boolean reloginEnabled = true

    Auth0Config(Map args) { init(args) }
}
