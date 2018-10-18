package io.xh.toolbox.user

import io.xh.hoist.user.BaseUserService
import io.xh.hoist.user.HoistUser

import static io.xh.hoist.util.Utils.withNewSession

class UserService extends BaseUserService {

    List<HoistUser> list(boolean activeOnly) {
        activeOnly ? User.findAllByEnabled(true) : User.list()
    }

    // TODO - ensure we have our caching setup correctly and confirm this is consistently fast.
    HoistUser find(String username) {
        return (HoistUser) withNewSession {
            User.findByEmail(username)
        }
    }
}
