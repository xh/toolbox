package io.xh.toolbox

import io.xh.hoist.user.BaseUserService
import io.xh.hoist.user.HoistUser
import io.xh.toolbox.user.User

class UserService extends BaseUserService {

    List<HoistUser> list(boolean activeOnly) {
        activeOnly ? User.findAllByEnabled(true) : User.list()
    }

    HoistUser find(String username) {
        return User.findByEmail(username)
    }
}
