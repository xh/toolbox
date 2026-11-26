package io.xh.toolbox.portfolio

import grails.testing.web.controllers.ControllerUnitTest
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

class PortfolioControllerSpec extends Specification implements ControllerUnitTest<PortfolioController>, HoistUnitTest {

    def 'closingPriceHistory reads daysBack from the query string, defaulting to 30'() {
        given:
        def portfolioService = Mock(PortfolioService)
        controller.portfolioService = portfolioService
        params.symbols = 'AAPL'
        if (daysBack != null) params.daysBack = daysBack

        when:
        controller.closingPriceHistory()

        then:
        1 * portfolioService.getClosingPriceHistory(['AAPL'], expected) >> [:]
        response.status == 200

        where:
        daysBack || expected
        '7'      || 7
        '90'     || 90
        null     || 30
    }

    def 'positions reads returnAllGroups from the query string'() {
        given:
        def positionService = Mock(PositionService)
        controller.positionService = positionService
        params.dims = 'fund,model'
        if (returnAllGroups != null) params.returnAllGroups = returnAllGroups

        when:
        controller.positions()

        then:
        1 * positionService.getPositions({ it.returnAllGroups == expected }) >> new PositionResultSet()
        response.status == 200

        where:
        returnAllGroups || expected
        'true'          || true
        'false'         || false
        null            || null
    }
}
