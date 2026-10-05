package io.xh.toolbox.user

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.directory.DirectoryService
import io.xh.hoist.util.ErrorOr

/**
 * Mock {@link DirectoryService} for Toolbox, so that all group-related controls in the Admin
 * Console Roles UI are live even when no real directory connection is configured.
 *
 * <p>Groups and their members come from a `mockDirectoryGroups` config, JSON formatted like:
 * `{"testGroupName": ["user1@example.com", "user2@example.com"]}`. Any name not in that config
 * resolves to an empty group, and the special name `sim_error` mocks a lookup failure.
 *
 * @see RoleService - selects this service when neither LdapService nor EntraIdService is enabled.
 */
class MockDirectoryService extends BaseService implements DirectoryService {

    ConfigService configService

    static clearCachesConfigs = ['mockDirectoryGroups']

    boolean getEnabled() {
        true
    }

    String getDirectoryGroupsDescription() {
        'Search the mock directory, or enter any name to mock a group.'
    }

    Map<String, ErrorOr<Set<String>>> loadUsersForDirectoryGroups(Set<String> groups, boolean strictMode) {
        groups.collectEntries { group ->
            [group, simError(group) ?: ErrorOr.of((mockGroups[group] ?: []) as Set)]
        }
    }

    Map<String, ErrorOr<Map>> describeDirectoryGroups(Set<String> groups) {
        groups.collectEntries { group ->
            [group, simError(group) ?: ErrorOr.of([displayName: group])]
        }
    }

    List<Map> searchDirectoryGroups(String namePart) {
        mockGroups.keySet()
            .findAll { it.toLowerCase().contains(namePart.toLowerCase()) }
            .collect { [id: it, displayName: it] }
    }

    Map getAdminStats() {[
        config: configForAdminStats('mockDirectoryGroups'),
        groupCount: mockGroups.size()
    ]}

    //------------------------
    // Implementation
    //------------------------
    private Map<String, List<String>> getMockGroups() {
        configService.getMap('mockDirectoryGroups', [:])
    }

    /**
     * Mirror real DirectoryService behavior for a single group that fails to resolve - report the
     * error as per-group data (in strict and non-strict modes alike, as with e.g. 'Directory Group
     * not found'), rather than throwing and failing the lookup as a whole. Displays as a warning
     * on the group within the Admin Console Roles UI.
     */
    private <T> ErrorOr<T> simError(String group) {
        group == 'sim_error'
            ? ErrorOr.error('There was a simulated error looking up this directory group.')
            : null
    }
}
