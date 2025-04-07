package io.xh.toolbox.security

import grails.compiler.GrailsCompileStatic
import grails.gorm.transactions.ReadOnly
import io.xh.hoist.security.BaseAuthenticationService
import io.xh.toolbox.user.User
import io.xh.toolbox.user.UserService

import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpServletRequest

import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig

/**
 * Toolbox's implementation of Hoist's {@link BaseAuthenticationService} contract for handling
 * authentication. This example is atypical of most application implementations of this service
 * in that it supports a fallback option for local username/password login as well as OAuth.
 *
 * Use the `oauthProvider` instance config to set the OAuth provider to use, or `NONE` to disable.
 *
 * It can also delegate to either {@link AuthZeroTokenService} or {@link EntraIdTokenService} to
 * validate JWTs when in OAuth mode, to support testing flows against either provider.
 */
@GrailsCompileStatic
class AuthenticationService extends BaseAuthenticationService {

    AuthZeroTokenService authZeroTokenService
    EntraIdTokenService entraIdTokenService
    UserService userService

    private String AUTH_HEADER = 'Authorization'

    AuthenticationService() {
        super()
        whitelistURIs.push('/gitHub/webhookTrigger')
    }

    Map getClientConfig() {
        switch (oauthProvider) {
            case 'AUTH_ZERO':
                return [useOAuth: true, *: authZeroTokenService.getClientConfig()];
            case 'ENTRA_ID':
                return [useOAuth: true, *: entraIdTokenService.getClientConfig()];
            default:
                return [useOAuth: false]
        }
    }

    String getOauthProvider() {
        getInstanceConfig('oauthProvider') ?: 'AUTH_ZERO'
    }

    boolean getUseOAuth() {
        getInstanceConfig('oauthProvider') != 'NONE'
    }

    /**
     * Evaluate a request to determine if an ID token can be extracted from headers installed by
     * the client and used to lookup/create and set an app User. This should transparently login
     * a user who has already authenticated via OAuth on the client when the UI goes to make its
     * first identity check back to the server.
     */
    protected boolean completeAuthentication(HttpServletRequest request, HttpServletResponse response) {
        if (!useOAuth) return true

        String token = request.getHeader(AUTH_HEADER)?.replace('Bearer ', '')
        TokenValidationResult tokenResult = null

        if (token) {
            tokenResult = oauthProvider == 'AUTH_ZERO' ?
                authZeroTokenService.validateToken(token) :
                entraIdTokenService.validateToken(token)

        } else {
            logTrace("Unable to validate inbound request - no token presented in header")
        }

        if (tokenResult) {
            def user = userService.getOrCreateFromTokenResult(tokenResult)
            setUser(request, user)
            logDebug('User read from token and set on session', [_username: user.username])
        } else {
            logDebug('Invalid token - no user set on session - return 401')
        }

        return true
    }

    /**
     * Process an interactive password-driven login - not for use by Oauth-sourced users.
     * Supported for forms-based login to admin client using the admin user created in Bootstrap.
     */
    boolean login(HttpServletRequest request, String username, String password) {
        def user = lookupUser(username, password)
        if (user) {
            setUser(request, user)
            return true
        }
        return false
    }

    boolean logout() {
        // No more work to do here - IdentityService will clear the auth username from the session.
        return true
    }


    @Override
    Map getAdminStats() {
        return [
            *: super.getAdminStats(),
            oauthProvider: oauthProvider,
            clientConfig: clientConfig
        ]
    }


    //------------------------
    // Implementation
    //------------------------
    @ReadOnly
    private User lookupUser(String username, String password) {
        def user = User.findByEmailAndEnabled(username, true)
        return user?.checkPassword(password) ? user : null
    }

}
