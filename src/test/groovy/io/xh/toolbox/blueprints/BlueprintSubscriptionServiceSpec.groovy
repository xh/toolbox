package io.xh.toolbox.blueprints

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.NotAuthorizedException
import io.xh.hoist.test.HoistUnitTest
import io.xh.toolbox.portfolio.MarketPrice
import io.xh.toolbox.portfolio.PortfolioConfig
import spock.lang.Specification

import static io.xh.hoist.cluster.ClusterService.instanceName
import static io.xh.toolbox.portfolio.PortfolioFixture.*

class BlueprintSubscriptionServiceSpec extends Specification implements ServiceUnitTest<BlueprintSubscriptionService>, HoistUnitTest {

    Map<String, MarketPrice> prices = currentPrices()
    String ch = channel('ann', '1'),
           gone = channel('ann', '2'),
           bobs = channel('bob', '3')
    // Open channels on this instance, by key, with their auth user.
    Map<String, String> channels = [(ch): 'ann', (gone): 'ann', (bobs): 'bob']
    List<List> pushes = []

    def setup() {
        testConfigService
            .registerTypedConfig('portfolioConfigs', PortfolioConfig)
            .set('portfolioConfigs', [pushUpdatesIntervalSecs: 3600])

        def portfolioService = new Expando(portfolio: portfolio(), currentPrices: prices, portfolioAvailable: true),
            webSocketService = new Expando()
        webSocketService.hasChannel = { String key -> channels.containsKey(key) }
        webSocketService.getLocalChannels = { channels.collect { k, u -> [key: k, authUsername: u] } }
        webSocketService.pushToChannel = { String key, String topic, Object data -> pushes << [key, topic, data] }

        service.portfolioService = portfolioService
        service.webSocketService = webSocketService
        service.blueprintDataService = new BlueprintDataService(portfolioService: portfolioService)
        loginAs('ann')
    }

    private static String channel(String user, String id) {
        "$user|$instanceName|$id"
    }

    private static Map positions(String asOf) {
        [dataset: 'positions', params: [asOf: asOf], fields: ['symbol', 'price']]
    }

    def 'subscribe returns the first rows, then pushes only what changes'() {
        when:
        def rows = service.subscribe(positions(D4.toString()), ch, 'live').rows
        service.pushUpdates()

        then:
        rows*.symbol.sort() == ['AAA', bond.symbol, opt.symbol].sort()
        pushes == []

        when:
        prices[eq.symbol] = new MarketPrice(day: D4, close: 140)
        service.pushUpdates()

        then:
        pushes.size() == 1
        pushes[0][0..1] == [ch, 'live']
        pushes[0][2] == [add: [], update: [[id: "$F1|Credit|Core|T|M|AAA", symbol: 'AAA', price: 140d]], remove: []]
    }

    def 'pushes carry the changed aggregates of the subscribed and added sets'() {
        given:
        def spec = [dataset: 'positions', params: [asOf: D4.toString()], fields: ['symbol', 'var95'], groupBy: [[]]]

        when:
        def first = service.subscribe(spec, ch, 'agg')

        then:
        first.aggregates*.dims == [[:]]

        when: 'a set is added through the aggregates endpoint'
        def added = service.aggregates(spec + [groupBy: [['fund']]], ch, 'agg')

        then:
        added*.dims.toSet() == [[fund: F1], [fund: F2]] as Set

        when: 'the underlying of both F1 equity and F2 option moves'
        prices[eq.symbol] = new MarketPrice(day: D4, close: 270)
        service.pushUpdates()
        Map push = pushes[0][2] as Map

        then:
        pushes.size() == 1
        push.update*.symbol.toSet() == ['AAA', opt.symbol] as Set
        push.aggregates*.dims.toSet() == [[:], [fund: F1], [fund: F2]] as Set
    }

    def 'the aggregates endpoint answers without a subscription, and ignores an unknown one'() {
        expect:
        service.aggregates([dataset: 'positions', params: [asOf: D4.toString()], fields: ['var95'], groupBy: [[]]])*.dims == [[:]]
        service.aggregates([dataset: 'positions', params: [asOf: D4.toString()], fields: ['var95'], groupBy: [[]]], ch, 'nope').size() == 1
        service.aggregates([dataset: 'positions', params: [asOf: D4.toString()], fields: ['mktVal'], groupBy: [[]]]) == []
    }

    def 'with pctNav requested, a price move pushes only the rows it moved'() {
        given:
        service.subscribe([dataset: 'positions', params: [asOf: D4.toString()], fields: ['symbol', 'mktVal', 'pctNav']], ch, 'nav')

        when:
        prices[bond.symbol] = new MarketPrice(day: D4, close: 101)
        service.pushUpdates()

        then:
        pushes.size() == 1
        (pushes[0][2] as Map).update*.symbol == [bond.symbol]
    }

    def 'a historical subscription never pushes'() {
        when:
        service.subscribe(positions(D3.toString()), ch, 'past')
        prices[eq.symbol] = new MarketPrice(day: D4, close: 150)
        service.pushUpdates()

        then:
        pushes == []
    }

    def 'unsubscribe and closed channels end a subscription'() {
        given:
        service.subscribe(positions(D4.toString()), ch, 'a')
        service.subscribe(positions(D4.toString()), gone, 'b')
        service.unsubscribe(ch, 'a')
        service.unsubscribe(ch, 'never-subscribed')
        channels.remove(gone)

        when:
        prices[eq.symbol] = new MarketPrice(day: D4, close: 160)
        service.pushUpdates()

        then:
        pushes == []
        service.adminStats.sessions == 0
    }

    def 'subscribe needs a channel and topic'() {
        when:
        service.subscribe(positions(D4.toString()), ch, null)

        then:
        thrown(BlueprintRequestException)
    }

    def 'subscribe accepts only an open channel of the caller'() {
        when:
        service.subscribe(positions(D4.toString()), key, 'live')

        then:
        thrown(NotAuthorizedException)
        service.adminStats.sessions == 0

        where:
        key << [channel('bob', '3'), channel('ann', 'closed'), 'ann|elsewhere', 'ann']
    }

    def "aggregates and unsubscribe leave another user's subscription alone"() {
        given:
        loginAs('bob')
        service.subscribe(positions(D4.toString()), bobs, 'live')
        loginAs('ann')

        when:
        service.aggregates([dataset: 'positions', params: [asOf: D4.toString()], fields: ['var95'], groupBy: [['fund']]], bobs, 'live')
        service.unsubscribe(bobs, 'live')
        prices[eq.symbol] = new MarketPrice(day: D4, close: 170)
        service.pushUpdates()

        then:
        pushes.size() == 1
        pushes[0][0] == bobs
        !(pushes[0][2] as Map).aggregates
    }
}
