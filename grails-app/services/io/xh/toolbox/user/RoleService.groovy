package io.xh.toolbox.user

import io.xh.hoist.user.BaseRoleService

import static io.xh.hoist.util.Utils.configService

/**
 * Toolbox sources its roles from a simple soft-configuration map of role -> username[].
 */
class RoleService extends BaseRoleService {

    Map<String, Set<String>> getAllRoleAssignments() {
        def ret = new HashMap<>()
        def confRoles = configService.getJSONObject('roles')
        confRoles.each{role, users ->
            ret[role] = users.toSet()
        }
        return ret
    }

}
