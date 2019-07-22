package io.xh.toolbox.portfolio

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class SalesController extends BaseController {

    def marketService

    def index(String symbol) {
        renderJSON(marketService.getMarketData(symbol))
    }

    def symbols() {
        renderJSON(marketService.getAllSymbols())
    }
}
