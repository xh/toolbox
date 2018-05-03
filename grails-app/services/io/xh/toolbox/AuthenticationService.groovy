package io.xh.toolbox

import io.xh.hoist.security.BaseAuthenticationService
import io.xh.hoist.user.HoistUser
import io.xh.toolbox.user.User

import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpServletRequest

import static io.xh.hoist.util.Utils.withNewSession

class AuthenticationService extends BaseAuthenticationService  {
    
    private static List<String> resources = getResourcePaths()

    protected boolean isWhitelist(HttpServletRequest request) {
        return request.requestURI.startsWith('/auth/') || isResource(request) || super.isWhitelist(request)
    }

    protected boolean completeAuthentication(HttpServletRequest request, HttpServletResponse response) {
        // 0) Don't attempt to authorize non-html/whitelisted requests (might handle ajax re-auth at some point)
        if (isAjax(request) || !acceptHtml(request) || isResource(request)) {
            return true
        }
        return false
    }

    protected boolean login(HttpServletRequest request, String username, String password) {
        def user = lookupUser(username, password)
        if (user) {
            setUser(request, user)
            return true
        }
        return false
    }

    private HoistUser lookupUser(String username, String password) {
        (HoistUser) withNewSession {
            def user = User.findByEmailAndEnabled(username, true)
            return user?.checkPassword(password) ? user : null
        }
    }

    private static boolean isResource(HttpServletRequest request) {
        def uri = request.getRequestURI()
        return resources.any {uri.endsWith(it)}
    }

    private static boolean isAjax(HttpServletRequest request) {
        return request.getHeader('X-Requested-With') == 'XMLHttpRequest'
    }

    private static boolean acceptHtml(HttpServletRequest request) {
        def accept = request.getHeader('ACCEPT')
        return accept && (accept.contains('*/*') || accept.contains('html'))
    }

    private static List<String> getResourcePaths() {
        return [
                '.css',
                '.ico',
                '.jpg',
                '.png',
                '.woff',
                '.woff2'
        ]
    }
}