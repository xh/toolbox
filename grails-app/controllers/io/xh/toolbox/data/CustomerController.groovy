package io.xh.toolbox.data

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class CustomerController extends BaseController {

    def customerService

    def index() {
        def id = params.id as Long,
            query = params.query as String,
            activeOnly = params.activeOnly as Boolean

        if (id && query) throw new RuntimeException('Cannot specify both query and id')
        if (id) {
            renderJSON(customerService.getCustomer(id))
            return
        }
        renderJSON(customerService.queryCustomers(query, activeOnly))
    }
}
