package io.xh.toolbox.user

import io.xh.hoist.role.provided.DefaultRoleService

/**
 * Toolbox leverages Hoist's built-in, database-backed Role management and its associated Admin Console UI.
 *
 * @see io.xh.hoist.role.provided.DefaultRoleService for details on this out-of-the-box option for Roles.
 * @see io.xh.hoist.role.BaseRoleService for details on how to implement an alternate, entirely custom approach.
 */
class RoleService extends DefaultRoleService {

    /**
     * Toolbox does not currently connect to an external directory, but supports a `mockDirectoryGroups` config
     * so we can simulate directory group lookups and see all group-related controls in the Admin Console Roles UI.
     *
     * Config should be JSON formatted like: `{"testGroupName": ["user1@example.com", "user2@example.com"]}`.
     *
     * This mock code also supports use of the special group name `sim_error` to mock a lookup failure.
     */
    protected Map<String, Object> doLoadUsersForDirectoryGroups(Set<String> groups, boolean strictMode) {
        def config = configService.getMap('mockDirectoryGroups', [:])

        return groups.collectEntries { group ->
            if (config[group]) return [group, config[group] as Set]
            if (group == 'sim_error') {
                def e = new RuntimeException('There was a simulated error looking up directory groups.')
                if (strictMode) throw e
                logError('There was an error', e)
            }
            return [group, [] as Set]
        }
    }
}
