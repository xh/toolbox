package io.xh.toolbox.security

import grails.gorm.transactions.ReadOnly
import io.xh.hoist.security.BaseAuthenticationService
import io.xh.hoist.user.HoistUser
import io.xh.toolbox.user.User
import io.xh.toolbox.user.UserService

import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpServletRequest

class AuthenticationService extends BaseAuthenticationService  {

    Auth0Service auth0Service
    UserService userService

    /** Add whitelist entry for OauthConfigController to allow client to call prior to auth. */
    protected List<String> whitelistURIs = [
        '/oauthConfig',
        '/gitHub/webhookTrigger',
        *super.whitelistURIs
    ]

    protected boolean isWhitelist(HttpServletRequest request) {
        def uri = request.requestURI
        return whitelistURIs.any{uri.endsWith(it)} || isWhitelistFile(uri)
    }

    /**
     * Evaluate a request to determine if an ID token can be extracted from headers installed by
     * the client and used to lookup/create and set an app User. This should transparently login
     * a user who has already authenticated via OAuth on the client when the UI goes to make its
     * first identity check back to the server.
     */
    protected boolean completeAuthentication(HttpServletRequest request, HttpServletResponse response) {
        def token = request.getHeader('x-xh-idt')

        // No token found - TODO - explain why we are returning true under these particular conditions.
        if (!token) {
            return (isAjax(request) || !acceptHtml(request) || isWhitelistFile(request.requestURI))
        }

        def tokenResult = auth0Service.validateToken(token)
        if (!tokenResult.isValid) {
            logDebug("Invalid token result - user will not be installed on session - return 401", tokenResult.exception)
            return true
        }

        def user = userService.getOrCreateFromJwtResult(tokenResult)
        setUser(request, user)
        logDebug("User read from token and set on request", "username: ${user.username}")
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

    private static boolean isAjax(HttpServletRequest request) {
        return request.getHeader('X-Requested-With') == 'XMLHttpRequest'
    }

    private static boolean acceptHtml(HttpServletRequest request) {
        def accept = request.getHeader('ACCEPT')
        return accept && (accept.contains('*/*') || accept.contains('html'))
    }

}
