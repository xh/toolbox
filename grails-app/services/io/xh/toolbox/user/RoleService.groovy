package io.xh.toolbox.user

import io.xh.hoist.user.BaseRoleService

import static io.xh.hoist.util.Utils.configService

/**
 * Every user in Toolbox is granted the base APP_READER role by default - this ensures that any
 * newly created users logging in via OAuth can immediately access the app.
 *
 * Other roles (HOIST_ADMIN) are sourced from a soft-configuration map of role -> username[].
 */
class RoleService extends BaseRoleService {

    static String READER_ROLE = 'APP_READER'


    Map<String, Set<String>> getAllRoleAssignments() {
        def ret = new HashMap<>()
        def confRoles = configService.getMap('roles')
        confRoles.each{role, users ->
            ret[role] = users.toSet()
        }

        // All users are granted a READER_ROLE as per class doc comment.
        def allUsernames = User.list().collect{user -> user.email}
        ret.put(READER_ROLE, new HashSet(allUsernames))

        return ret
    }

    Set<String> getAllRoles() {
        return allRoleAssignments.keySet()
    }

}
