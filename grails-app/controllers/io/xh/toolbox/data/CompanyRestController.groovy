package io.xh.toolbox.data

import io.xh.hoist.RestController
import io.xh.hoist.security.Access
import io.xh.toolbox.company.Company
import org.grails.web.json.JSONObject

@Access(['APP_READER'])
class CompanyRestController extends RestController {

    static restTarget = Company
    static trackChanges = true

    def lookupData() {
        renderJSON(
            types: Company.TYPES
        )
    }

    protected void preprocessSubmit(JSONObject submit) {
        submit.lastUpdatedBy = username
    }

}
