package io.xh.toolbox.user

import io.xh.hoist.role.provided.DefaultRoleService
import io.xh.hoist.util.ErrorOr

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
    protected Map<String, ErrorOr<Set<String>>> doLoadUsersForDirectoryGroups(Set<String> groups, boolean strictMode) {
        // Delegate to a real directory service when one is enabled - in particular EntraIdService
        // against the XH Entra ID tenant, for which Toolbox is the framework testbed. Falls back
        // to the mock support below when no real directory connection is configured.
        if (ldapService.enabled || entraIdService.enabled) {
            return super.doLoadUsersForDirectoryGroups(groups, strictMode)
        }

        def config = configService.getMap('mockDirectoryGroups', [:])

        return groups.collectEntries { group ->
            if (config[group]) return [group, ErrorOr.of(config[group] as Set)]
            if (group == 'sim_error') {
                // Mirror real DirectoryService behavior for a single group that fails to
                // resolve - report the error as per-group data (in strict and non-strict modes
                // alike, as with e.g. 'Directory Group not found'), rather than throwing and
                // failing the lookup as a whole. Displays as a warning on the group within the
                // Admin Console Roles UI.
                return [group, ErrorOr.error('There was a simulated error looking up this directory group.')]
            }
            return [group, ErrorOr.of([] as Set)]
        }
    }
}
