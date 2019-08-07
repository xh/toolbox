package io.xh.toolbox.portfolio

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class PortfolioController extends BaseController {

    def portfolioService,
        positionService

    def positions() {
        PositionQuery query = parsePositionQuery(params)
        renderJSON(positionService.getPositions(query))
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
        List<MarketPrice> historicalPrices = portfolioService.getData().historicalPrices[params.id]
        MarketPrice intradayPrices = portfolioService.getData().intradayPrices[params.id]
        List<MarketPrice> allPrices = intradayPrices ? historicalPrices+[intradayPrices] : historicalPrices
        renderJSON(allPrices)
    }

    def lookups() {
        renderJSON(portfolioService.getLookups())
    }

    private PositionQuery parsePositionQuery(Map params) {
        List<String> dims = params.dims.split(',') as List<String>
        Integer maxCount = params.maxPositions as Integer
        Boolean returnAllGroups = params.returnAllGroups as Boolean
        return new PositionQuery(
                dims: dims,
                maxCount: maxCount,
                returnAllGroups: returnAllGroups
        )
    }

}
