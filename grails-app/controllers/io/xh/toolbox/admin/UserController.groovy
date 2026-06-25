package io.xh.toolbox.admin

import io.xh.hoist.admin.AdminRestController
import io.xh.hoist.security.AccessRequiresRole
import io.xh.toolbox.user.User

@AccessRequiresRole('HOIST_ADMIN_READER')
class UserController extends AdminRestController {

    static restTarget = User
    static trackChanges = true
}