package io.xh.toolbox.data

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class CustomerController extends BaseController {

    def customerService

    def index() {
        renderJSON(customerService.queryCustomers(params.query))
    }
}
