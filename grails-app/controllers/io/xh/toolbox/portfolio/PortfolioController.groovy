package io.xh.toolbox.portfolio

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class PortfolioController extends BaseController {

    def portfolioService,
        positionService

    def positions() {
        List<String> dims = params.dims.split(',') as List<String>
        Map options = [:]
        Long maxPositions = params.maxPositions as Long
        if (maxPositions) options.maxPositions = maxPositions
        renderJSON(positionService.getPositions(dims, options))
    }

    def position() {
        renderJSON(positionService.getPosition(params.positionId))
    }

    def ordersForPosition() {
        renderJSON(positionService.ordersForPosition(params.positionId))
    }

    def rawPositions() {
        renderJSON(portfolioService.getData().rawPositions)
    }

    def orders() {
        renderJSON(portfolioService.getData().orders)
    }

    def symbols() {
        renderJSON(portfolioService.getData().instruments.keySet())
    }

    def instrument() {
        renderJSON(portfolioService.getData().instruments[params.id])
    }

    // List of MarketPrices for the given instrument identified by its symbol
    def prices() {
        renderJSON(portfolioService.getData().marketPrices[params.id])
    }

    def lookups() {
        renderJSON(portfolioService.getLookups())
    }
}
