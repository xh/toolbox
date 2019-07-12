package io.xh.toolbox.data

import io.xh.hoist.RestController
import io.xh.hoist.security.Access
import io.xh.toolbox.company.Company
import org.grails.web.json.JSONObject

@Access(['APP_READER'])
class CompanyController extends RestController {

    def companyService

    def index() {
        renderJSON(companyService.getCompanies())
    }
}
