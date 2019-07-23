package io.xh.toolbox.portfolio

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class PortfolioController extends BaseController {

    def portfolioService

    def index() {
        List<String> dims = params.dims.split(',') as List<String>
        renderJSON(portfolioService.getPortfolio(dims))
    }

    def rawPositions() {
        renderJSON(portfolioService.getRawPositions())
    }

    def position() {
        renderJSON(portfolioService.getPosition(params.positionId))
    }

    def orders() {
        renderJSON(portfolioService.getAllOrders())
    }

    def filteredOrders() {
        renderJSON(portfolioService.getOrders(params.positionId))
    }
}
