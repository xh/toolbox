package io.xh.toolbox.data

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class TradeController extends BaseController {

    def tradeService

    def index() {
        renderJSON(tradeService.getTrades())
    }
}