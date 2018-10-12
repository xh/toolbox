/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

package io.xh.toolbox.company

import io.xh.hoist.RestController
import io.xh.hoist.security.Access
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
