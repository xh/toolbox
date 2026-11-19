package io.xh.toolbox.blueprints

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.test.HoistUnitTest
import io.xh.toolbox.portfolio.MarketPrice
import io.xh.toolbox.portfolio.PortfolioConfig
import spock.lang.Specification

import static io.xh.toolbox.portfolio.PortfolioFixture.*

class BlueprintSubscriptionServiceSpec extends Specification implements ServiceUnitTest<BlueprintSubscriptionService>, HoistUnitTest {

    Map<String, MarketPrice> prices = currentPrices()
    Set<String> channels = ['ch'] as Set
    List<List> pushes = []

    def setup() {
        testConfigService
            .registerTypedConfig('portfolioConfigs', PortfolioConfig)
            .set('portfolioConfigs', [pushUpdatesIntervalSecs: 3600])

        def portfolioService = new Expando(portfolio: portfolio(), currentPrices: prices, portfolioAvailable: true),
            webSocketService = new Expando()
        webSocketService.hasChannel = { String key -> key in channels }
        webSocketService.pushToChannel = { String key, String topic, Object data -> pushes << [key, topic, data] }

        service.portfolioService = portfolioService
        service.webSocketService = webSocketService
        service.blueprintDataService = new BlueprintDataService(portfolioService: portfolioService)
    }

    private static Map positions(String asOf) {
        [dataset: 'positions', params: [asOf: asOf], fields: ['symbol', 'price']]
    }

    def 'subscribe returns the first rows, then pushes only what changes'() {
        when:
        def rows = service.subscribe(positions(D4.toString()), 'ch', 'live')
        service.pushUpdates()

        then:
        rows*.symbol.sort() == ['AAA', bond.symbol, opt.symbol].sort()
        pushes == []

        when:
        prices[eq.symbol] = new MarketPrice(day: D4, close: 140)
        service.pushUpdates()

        then:
        pushes.size() == 1
        pushes[0][0..1] == ['ch', 'live']
        pushes[0][2] == [add: [], update: [[id: "$F1|Credit|Core|T|M|AAA", symbol: 'AAA', price: 140d]], remove: []]
    }

    def 'a historical subscription never pushes'() {
        when:
        service.subscribe(positions(D3.toString()), 'ch', 'past')
        prices[eq.symbol] = new MarketPrice(day: D4, close: 150)
        service.pushUpdates()

        then:
        pushes == []
    }

    def 'unsubscribe and closed channels end a subscription'() {
        given:
        service.subscribe(positions(D4.toString()), 'ch', 'a')
        service.subscribe(positions(D4.toString()), 'gone', 'b')
        service.unsubscribe('ch', 'a')
        service.unsubscribe('ch', 'never-subscribed')

        when:
        prices[eq.symbol] = new MarketPrice(day: D4, close: 160)
        service.pushUpdates()

        then:
        pushes == []
        service.adminStats.sessions == 0
    }

    def 'subscribe needs a channel and topic'() {
        when:
        service.subscribe(positions(D4.toString()), 'ch', null)

        then:
        thrown(BlueprintRequestException)
    }
}
