package io.xh.toolbox.admin

import io.xh.hoist.BaseController
import io.xh.hoist.security.AccessAll

@AccessAll()
class AuthController extends BaseController {

    def authenticationService

    def authUser() {
        renderJSON(authUser: identityService.getAuthUser())
    }

    def login(String username, String password) {
        renderJSON(success: authenticationService.login(request, username, password))
    }

}
