package io.xh.toolbox.portfolio

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class MarketController extends BaseController {

    def marketService

    def prices() {
        renderJSON(marketService.getMarketData(params.id))
    }

    def instrument() {
        renderJSON(marketService.getInstrument(params.id))
    }

    def symbols() {
        renderJSON(marketService.getAllSymbols())
    }
}
