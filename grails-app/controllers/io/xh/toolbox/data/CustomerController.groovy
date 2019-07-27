package io.xh.toolbox.data

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class CustomerController extends BaseController {

    def customerService

    def index() {
        renderJSON(customerService.queryCustomers(params.query))
    }
}
