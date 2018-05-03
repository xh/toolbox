package io.xh.toolbox.admin

import io.xh.hoist.RestController
import io.xh.hoist.security.Access
import io.xh.toolbox.user.User

@Access(['HOIST_ADMIN'])
class UserController extends RestController {

    static restTarget = User
    static trackChanges = true
}