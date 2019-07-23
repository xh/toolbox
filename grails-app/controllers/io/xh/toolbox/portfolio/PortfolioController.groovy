package io.xh.toolbox.portfolio

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class PortfolioController extends BaseController {

    def portfolioService

    def index() {
        renderJSON(portfolioService.getPortfolio(["fund", "trader", "model"], false))
    }
}
