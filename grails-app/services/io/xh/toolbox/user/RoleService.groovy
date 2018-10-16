package io.xh.toolbox.user

import io.xh.hoist.user.BaseRoleService
import org.grails.web.json.JSONArray

import static io.xh.hoist.util.Utils.configService

/**
 * Toolbox sources its roles from a simple soft-configuration map of role -> username[].
 */
class RoleService extends BaseRoleService {

    Map<String, Set<String>> getAllRoleAssignments() {
        def confRoles = configService.getJSONObject('roles'),
            ret = [:]

        confRoles.each{String role, JSONArray users ->
            ret[role] = users.toSet()
        }

        return ret
    }

}
