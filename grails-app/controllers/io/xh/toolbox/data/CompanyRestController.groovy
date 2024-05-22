package io.xh.toolbox.data

import io.xh.hoist.RestController
import io.xh.hoist.security.AccessAll

@AccessAll
class CompanyRestController extends RestController {

    static restTarget = Company
    static trackChanges = true

    def lookupData() {
        renderJSON(
            types: Company.TYPES
        )
    }

    protected void preprocessSubmit(Map submit) {
        submit.lastUpdatedBy = username
    }

}
