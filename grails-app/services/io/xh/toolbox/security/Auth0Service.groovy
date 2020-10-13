package io.xh.toolbox.security

import groovy.util.logging.Slf4j
import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.toolbox.user.User
import org.apache.http.client.methods.HttpGet

import static io.xh.hoist.util.Utils.withNewSession

@Slf4j
class Auth0Service extends BaseService {

    ConfigService configService

    // TODO - discuss if we want to save OAuth-sourced users in our app DB - we could keep them
    //      in-memory only, avoiding the need to update any fields that might have changed.
    // TODO - discuss handling for user who logs on first with one OAuth identity provider and then
    //      another - where the email is the same across the two. Note Auth0 has support for linking
    //      multiple provider-specific identities together if we want to do that.
    User getOrCreateUser(String token) {
        (User) withNewSession {
            Map ui = getUserInfo(token)
            String username = ui.sub as String
            User user = User.findByUsername(username)

            if (!user) {
                user = new User(
                    username: username,
                    name: ui.name,
                    email: ui.email,
                    profilePicUrl: ui.picture
                ).save()
                log.info("Created new user from token | username: ${user.username} | email: ${user.email}")
            }

            return user
        }
    }

    Map getUserInfo(String token) {
        def url = "https://${configService.getString('auth0Host')}/userinfo",
            get = new HttpGet(url)

        get.addHeader('Authorization', "Bearer ${token}")
        def resp = jsonClient.executeAsMap(get)
        log.debug("Fetched user info for ${resp.email} | sub: ${resp.sub} | token: ${token}")

        return resp
    }


    //------------------------
    // Implementation
    //------------------------
    private JSONClient _jsonClient
    JSONClient getJsonClient() {
        if (!_jsonClient) _jsonClient = new JSONClient()
        return _jsonClient
    }

    void clearCaches() {
        _jsonClient = null
    }

}
