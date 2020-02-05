package io.xh.toolbox.admin

import io.xh.hoist.RestController
import io.xh.hoist.security.Access
import io.xh.toolbox.roadmap.Phase
import org.grails.web.json.JSONObject

@Access(['HOIST_ADMIN'])
class PhaseRestController extends RestController {

    static restTarget = Phase
    static trackChanges = true

    protected void preprocessSubmit(JSONObject submit) {
        submit.lastUpdatedBy = username
    }
}
