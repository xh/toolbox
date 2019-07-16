package io.xh.toolbox.data

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class PortfolioController extends BaseController {

    def portfolioService

    def index() {
        renderJSON(portfolioService.generateSymbol())
    }
}
