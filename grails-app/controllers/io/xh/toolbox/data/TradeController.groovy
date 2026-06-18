package io.xh.toolbox.data

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class TradeController extends BaseController {

    def tradeService

    def index() {
        renderJSON(tradeService.getTrades())
    }
}