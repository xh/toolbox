package io.xh.toolbox.admin

import io.xh.hoist.admin.AdminRestController
import io.xh.hoist.security.Access
import io.xh.toolbox.user.User

@Access(['HOIST_ADMIN_READER'])
class UserController extends AdminRestController {

    static restTarget = User
    static trackChanges = true
}