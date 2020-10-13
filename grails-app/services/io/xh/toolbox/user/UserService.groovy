package io.xh.toolbox.user

import io.xh.hoist.user.BaseUserService

import static io.xh.hoist.util.Utils.withNewSession

class UserService extends BaseUserService {

    @Override
    List<User> list(boolean activeOnly) {
        activeOnly ? User.findAllByEnabled(true) : User.list()
    }

    @Override
    User find(String username) {
        return (User) withNewSession {
            User.findByUsername(username)
        }
    }
}
