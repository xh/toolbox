package io.xh.toolbox.gridview

import io.xh.hoist.RestController
import io.xh.hoist.exception.NotAuthorizedException
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.security.Access
import io.xh.toolbox.user.RoleService

@Access(['APP_READER'])
class GridViewController extends RestController {

    RoleService roleService

    static restTarget = GridView

    @Override
    protected void preprocessSubmit(Map submit) {
        if (!userCanSubmit(submit)) {
            throw new NotAuthorizedException()
        }

        submit.lastUpdatedBy = username

        if (submit.containsKey('value')) {
            submit.value = JSONSerializer.serialize(submit.value)
        }

        if (submit.containsKey('acl') && submit.acl != "*") {
            submit.acl = submit.acl ? JSONSerializer.serialize(submit.acl) : null
        }
    }

    @Override
    protected void doCreate(Object obj, Object data) {
        obj = obj as GridView
        obj.createdBy = username
        obj.save(flush: true)
    }

    @Override
    protected List doList(Map query) {
        return GridView.list().findAll { userCanAccess(it) }
    }

    def lookupData() {
        renderJSON(acl: [roles: roleService.allRoles.toList().sort()])
    }

    protected boolean userCanSubmit(Map submit) {
        return (
            submit.id == null ||
            isAdmin() ||
            GridView.get(submit.id as Long)?.isPrivateTo(user)
        )
    }

    protected boolean userCanAccess(GridView gridView) {
        return gridView.userCanAccess(user) || (isAdmin() && !gridView.isPrivate)
    }

    boolean isAdmin() {
        return user.isHoistAdmin
    }

}
