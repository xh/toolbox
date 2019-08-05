package io.xh.toolbox.data

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class SalesController extends BaseController {

    def salesService

    def index() {
        renderJSON(salesService.getSales())
    }
}