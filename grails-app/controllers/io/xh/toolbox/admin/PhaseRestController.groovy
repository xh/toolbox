package io.xh.toolbox.admin

import io.xh.hoist.admin.AdminRestController
import io.xh.hoist.security.Access
import io.xh.toolbox.roadmap.Phase

@Access(['HOIST_ADMIN_READER'])
class PhaseRestController extends AdminRestController {

    static restTarget = Phase
    static trackChanges = true

    protected void preprocessSubmit(Map submit) {
        submit.lastUpdatedBy = username
    }
}
