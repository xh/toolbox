package io.xh.toolbox.user

import grails.gorm.transactions.Transactional
import io.xh.hoist.role.provided.DefaultRoleService

import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig

class RoleService extends DefaultRoleService {
    @Override
    void init() {
        super.init()
        assignLocalAdminRolesIfNeeded()
    }

    @Transactional
    private void assignLocalAdminRolesIfNeeded() {
        String adminUsername = getInstanceConfig('adminUsername')
        if (adminUsername) {
            def user = User.findByEmail(adminUsername)
            roleAdminService.ensureUserHasRoles(user, ['HOIST_ADMIN', 'HOIST_ADMIN_READER', 'HOIST_ROLE_MANAGER'])
        }
    }
}
