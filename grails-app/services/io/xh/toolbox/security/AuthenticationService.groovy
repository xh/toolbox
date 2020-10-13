package io.xh.toolbox.security

import groovy.util.logging.Slf4j
import io.xh.hoist.security.BaseAuthenticationService
import io.xh.hoist.user.HoistUser
import io.xh.toolbox.user.User

import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpServletRequest

import static io.xh.hoist.util.Utils.withNewSession

@Slf4j
class AuthenticationService extends BaseAuthenticationService  {

    Auth0Service auth0Service

    /**
     * Evaluate a request to determine if an auth token can be extracted from headers installed by
     * the client and used to lookup/create and set an app User. This should transparently login
     * a user who has already authenticated via OAuth on the client when the UI goes to make its
     * first identity check back to the server.
     */
    protected boolean completeAuthentication(HttpServletRequest request, HttpServletResponse response) {
        def token = request.getHeader('x-xh-idt')

        // No token found - TODO - summarize why we are returning true under these conditions.
        if (!token) {
            return (isAjax(request) || !acceptHtml(request) || isWhitelistFile(request.requestURI))
        }

        def user = auth0Service.getOrCreateUser(token)
        if (user) {
            setUser(request, user)
            log.debug("User read from token and set on request | username: ${user.username} | token: ${token}")
        }

        return true
    }

    /**
     * Process an interactive password-driven login - not for use by Oauth-sourced users.
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
    private HoistUser lookupUser(String username, String password) {
        (HoistUser) withNewSession {
            def user = User.findByUsernameAndEnabled(username, true)
            return user?.checkPassword(password) ? user : null
        }
    }

    private static boolean isAjax(HttpServletRequest request) {
        return request.getHeader('X-Requested-With') == 'XMLHttpRequest'
    }

    private static boolean acceptHtml(HttpServletRequest request) {
        def accept = request.getHeader('ACCEPT')
        return accept && (accept.contains('*/*') || accept.contains('html'))
    }

}