package io.xh.toolbox.security

import grails.gorm.transactions.ReadOnly
import io.xh.hoist.security.BaseAuthenticationService
import io.xh.hoist.user.HoistUser
import io.xh.toolbox.user.User
import io.xh.toolbox.user.UserService

import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpServletRequest

import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig

class AuthenticationService extends BaseAuthenticationService  {

    Auth0Service auth0Service
    UserService userService

    AuthenticationService() {
        super()
        whitelistURIs.push('/gitHub/webhookTrigger')
    }

    Map getClientConfig() {
        useOAuth ?
            [useOAuth: true, *: auth0Service.getClientConfig()] :
            [useOAuth: false]
    }

    /**
     * Evaluate a request to determine if an ID token can be extracted from headers installed by
     * the client and used to lookup/create and set an app User. This should transparently login
     * a user who has already authenticated via OAuth on the client when the UI goes to make its
     * first identity check back to the server.
     */
    protected boolean completeAuthentication(HttpServletRequest request, HttpServletResponse response) {
        if (!useOAuth) {
            return true
        }

        def token = request.getHeader('x-xh-idt'),
            tokenResult = auth0Service.validateToken(token)
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


    //------------------------
    // Implementation
    //------------------------
    @ReadOnly
    private HoistUser lookupUser(String username, String password) {
        def user = User.findByEmailAndEnabled(username, true)
        return user?.checkPassword(password) ? user : null
    }

    private static boolean getUseOAuth() {
        getInstanceConfig('useOAuth') != 'false'
    }

}
