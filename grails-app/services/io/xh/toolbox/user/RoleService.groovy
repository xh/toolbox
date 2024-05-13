package io.xh.toolbox.user

import io.xh.hoist.role.provided.DefaultRoleService

/**
 * Toolbox leverages Hoist's built-in, database-backed Role management and its associated Admin Console UI.
 *
 * @see io.xh.hoist.role.provided.DefaultRoleService for details on this out-of-the-box option for Roles.
 * @see io.xh.hoist.role.BaseRoleService for details on how to implement an alternate, entirely custom approach.
 */
class RoleService extends DefaultRoleService {

    protected Map<String, Object> doLoadUsersForDirectoryGroups(Set<String> groups, boolean strictMode) {
        def config = configService.getMap('testDirectories', [:])

        return groups.collectEntries { group ->
            if (!group.startsWith('xh:')) return [group, "Directory name should start with 'xh:'"];

            def key = group.takeAfter('xh:')
            if (config[key]) return [group, config[key] as Set]
            if (key == 'sim_error') {
                def e = new RuntimeException('There was a simulated error looking up directory groups.')
                if (strictMode) throw e
                logError('There was an error', e)
            }
            return [group, [] as Set]
        }
    }
}