package io.xh.toolbox.security

import io.xh.hoist.security.AccessAll
import io.xh.hoist.security.BaseOauthConfigController
import io.xh.hoist.security.BaseOauthService

/**
 * Controller, accessible pre-auth via AuthenticationService whitelist, to allow soft-config of
 * Auth0/Oauth related settings on the client.
 */
@AccessAll
class OauthConfigController extends BaseOauthConfigController {

    OauthService oauthService

    protected BaseOauthService getOauthService() {
        return oauthService
    }

}
