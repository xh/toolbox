package io.xh.toolbox.user

import grails.gorm.transactions.ReadOnly
import io.xh.hoist.user.BaseUserService
import io.xh.hoist.user.HoistUser

class UserService extends BaseUserService {

    @ReadOnly
    List<HoistUser> list(boolean activeOnly) {
        activeOnly ? User.findAllByEnabled(true) : User.list()
    }

    // TODO - ensure we have our caching setup correctly and confirm this is consistently fast.
    @ReadOnly
    HoistUser find(String username) {
        return (HoistUser) User.findByEmail(username)
    }
}
