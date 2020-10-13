package io.xh.toolbox.user

import io.xh.hoist.user.BaseRoleService

import static io.xh.hoist.util.Utils.configService
import static io.xh.hoist.util.Utils.withNewSession

/**
 * Every user in Toolbox is granted the base APP_READER role by default.
 * Other roles are sourced from a simple soft-configuration map of role -> username[].
 * TODO - research Auth0 support for roles.
 */
class RoleService extends BaseRoleService {

    static String READER_ROLE = 'APP_READER'

    Map<String, Set<String>> getAllRoleAssignments() {
        def ret = new HashMap<>()
        withNewSession {
            def confRoles = configService.getMap('roles')
            confRoles.each{role, users ->
                ret[role] = users.toSet()
            }
        }

        return ret
    }

    Set<String> getRolesForUser(String username) {
        def ret = super.getRolesForUser(username)

        // Ensure minimal APP_READER role available on all users, specifically Oauth-created
        // users without any entries in our local roles config.
        if (!ret.contains(READER_ROLE)) {
            ret = new HashSet<String>(ret)
            ret.add(READER_ROLE)
        }

        return ret
    }

}
