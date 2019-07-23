package io.xh.toolbox.portfolio

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class MarketController extends BaseController {

    def marketService

    def index() {
        renderJSON(marketService.getMarketData(params.symbol))
    }

    def instrument() {
        renderJSON(marketService.getInstrument(params.symbol))
    }

    def symbols() {
        renderJSON(marketService.getAllSymbols())
    }
}
