package io.xh.toolbox.data

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class SalesController extends BaseController {

    def salesService

    def index() {
        renderJSON(salesService.getSales())
    }
}