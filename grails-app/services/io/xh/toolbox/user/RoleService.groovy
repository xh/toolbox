package io.xh.toolbox.user

import grails.gorm.transactions.Transactional
import io.xh.hoist.role.provided.DefaultRoleService

import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig

/**
 * Toolbox leverages Hoist's built-in, database-backed Role management and its associated Admin Console UI.
 *
 * @see io.xh.hoist.role.provided.DefaultRoleService for details on this out-of-the-box option for Roles.
 * @see io.xh.hoist.role.BaseRoleService for details on how to implement an alternate, entirely custom approach.
 */
class RoleService extends DefaultRoleService {

    void init() {
        super.init()
        assignLocalAdminRolesIfNeeded()
    }

    @Transactional
    private void assignLocalAdminRolesIfNeeded() {
        String adminUsername = getInstanceConfig('adminUsername')
        if (adminUsername) {
            def user = User.findByEmail(adminUsername)
            assignRole(user, 'HOIST_ADMIN')
            assignRole(user, 'HOIST_ROLE_MANAGER')
        }
    }
}
