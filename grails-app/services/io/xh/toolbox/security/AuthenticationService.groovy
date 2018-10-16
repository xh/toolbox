package io.xh.toolbox.security

import io.xh.hoist.security.BaseAuthenticationService
import io.xh.hoist.user.HoistUser
import io.xh.toolbox.user.User

import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpServletRequest

import static io.xh.hoist.util.Utils.withNewSession

class AuthenticationService extends BaseAuthenticationService  {

    // TODO - clarify this implementation - I'm still not sure as to why it's setup as it is - ATM
    protected boolean completeAuthentication(HttpServletRequest request, HttpServletResponse response) {
        // Don't attempt to authorize non-html/whitelisted requests (might handle ajax re-auth at some point)
        if (isAjax(request) || !acceptHtml(request) || isWhitelistFile(request.requestURI)) {
            return true
        }
        return false
    }

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
            def user = User.findByEmailAndEnabled(username, true)
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