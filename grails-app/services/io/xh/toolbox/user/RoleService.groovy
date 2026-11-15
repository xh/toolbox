package io.xh.toolbox.user

import io.xh.hoist.directory.DirectoryService
import io.xh.hoist.role.provided.DefaultRoleService
import io.xh.hoist.role.provided.RoleSpec

import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig
import static io.xh.hoist.util.Utils.isLocalDevelopment
import static io.xh.hoist.util.Utils.isProduction

/**
 * Toolbox leverages Hoist's built-in, database-backed Role management and its associated Admin Console UI.
 *
 * @see io.xh.hoist.role.provided.DefaultRoleService for details on this out-of-the-box option for Roles.
 * @see io.xh.hoist.role.BaseRoleService for details on how to implement an alternate, entirely custom approach.
 */
class RoleService extends DefaultRoleService {

    MockDirectoryService mockDirectoryService

    private String bootstrapAdminUser = null

    /**
     * Note the local bootstrap admin, with the same local development guard that Hoist applies
     * when it grants that user its admin roles.
     */
    void init() {
        super.init()
        if (isLocalDevelopment && !isProduction) {
            bootstrapAdminUser = getInstanceConfig('bootstrapAdminUser')?.toLowerCase()
        }
    }

    /**
     * Give the local bootstrap admin TOOLBOX_LLM_USER, so an agent on a throwaway database can
     * test the Live Model demo. Hoist grants that user its admin roles by name, so it gets no role
     * that lists HOIST_ADMIN as a member. The hourly limit on model calls still applies.
     */
    @Override
    Set<String> getRolesForUser(String username) {
        def ret = super.getRolesForUser(username)
        if (bootstrapAdminUser && bootstrapAdminUser == username.toLowerCase()) {
            ret += 'TOOLBOX_LLM_USER'
        }
        ret
    }

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

    /**
     * Create the roles for the Live Model demo on the Chat Kit tab - see LlmService. HOIST_ADMIN
     * members get both. Grant TOOLBOX_LLM_USER to users or directory groups in the Admin Console.
     */
    @Override
    protected void ensureRequiredConfigAndRolesCreated() {
        super.ensureRequiredConfigAndRolesCreated()
        ensureRequiredRolesCreated([
            new RoleSpec(
                name: 'TOOLBOX_LLM_UNLIMITED',
                category: 'Toolbox',
                notes: 'Can use the Live Model demo on the Chat Kit tab, with no hourly limit on model calls.',
                roles: ['HOIST_ADMIN']
            ),
            new RoleSpec(
                name: 'TOOLBOX_LLM_USER',
                category: 'Toolbox',
                notes: 'Can use the Live Model demo on the Chat Kit tab.',
                roles: ['TOOLBOX_LLM_UNLIMITED']
            )
        ])
    }
}
