package io.xh.toolbox.user

import io.xh.hoist.directory.DirectoryService
import io.xh.hoist.role.provided.DefaultRoleService

/**
 * Toolbox leverages Hoist's built-in, database-backed Role management and its associated Admin Console UI.
 *
 * @see io.xh.hoist.role.provided.DefaultRoleService for details on this out-of-the-box option for Roles.
 * @see io.xh.hoist.role.BaseRoleService for details on how to implement an alternate, entirely custom approach.
 */
class RoleService extends DefaultRoleService {

    MockDirectoryService mockDirectoryService

    /**
     * Use a real directory service when one is enabled - in particular EntraIdService against the
     * XH Entra ID tenant, for which Toolbox is the framework testbed. Falls back to
     * {@link MockDirectoryService} when no real directory connection is configured, so that group
     * resolution, display names, and group search all stay live in the Admin Console Roles UI.
     */
    protected DirectoryService getDirectoryService() {
        def svc = super.getDirectoryService()
        svc.enabled ? svc : mockDirectoryService
    }
}
