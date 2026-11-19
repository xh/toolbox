package io.xh.toolbox.blueprints

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

import static io.xh.toolbox.portfolio.PortfolioFixture.*

class BlueprintDataServiceSpec extends Specification implements ServiceUnitTest<BlueprintDataService>, HoistUnitTest {

    private List<Map> rows(Map spec) {
        service.getRows(service.parseRequest(spec), datasets())
    }

    def 'rows hold an id plus the requested fields and field instances, in request order'() {
        when:
        def result = rows(
            dataset: 'positions',
            params: [asOf: D4.toString(), fund: F1],
            fields: ['symbol', 'mktVal', [name: 'ret', field: 'return', params: [start: D1.toString(), end: D3.toString()]],
                     [name: 'down10', field: 'shockedPnl', params: [shock: -0.1]]]
        )
        def aaa = result.find { it.symbol == 'AAA' }

        then:
        result.size() == 2
        aaa.keySet() as List == ['id', 'symbol', 'mktVal', 'ret', 'down10']
        aaa.id == "$F1|Credit|Core|T|M|AAA"
        aaa.mktVal == 21600
        Math.abs(aaa.ret - 0.2) < 1e-9
        aaa.down10 == -2592
    }

    def 'the source filter applies on the server, including to field instances'() {
        expect:
        rows(dataset: 'positions', params: [asOf: D4.toString()], fields: ['symbol'],
             filter: [field: 'instrumentType', op: '=', value: ['Option', 'Bond']])*.symbol.sort() == [bond.symbol, opt.symbol].sort()

        rows(dataset: 'positions', params: [asOf: D4.toString()],
             fields: ['symbol', [name: 'down10', field: 'shockedPnl', params: [shock: -0.1]]],
             filter: [filters: [[field: 'down10', op: '<', value: -2000], [field: 'symbol', op: '=', value: 'AAA']], op: 'AND'])*.symbol == ['AAA']
    }

    def 'orders return the orders on asOf'() {
        expect:
        rows(dataset: 'orders', params: [asOf: D2.toString()], fields: ['orderId', 'dir', 'mktVal']) == [
            [id: 'o5', orderId: 'o5', dir: 'Buy', mktVal: 2200],
            [id: 'o6', orderId: 'o6', dir: 'Buy', mktVal: 100000]
        ]
    }

    def 'prices serve one symbol over a window, and an unknown symbol is an error'() {
        expect:
        rows(dataset: 'prices', params: [symbol: 'AAA', start: D3.toString(), end: D4.toString()], fields: ['day', 'close']) == [
            [id: "AAA|$D3".toString(), day: D3.toString(), close: 120d],
            [id: "AAA|$D4".toString(), day: D4.toString(), close: 135d]
        ]

        when:
        rows(dataset: 'prices', params: [symbol: 'ZZZ', start: D3.toString(), end: D4.toString()], fields: ['close'])

        then:
        def e = thrown(BlueprintRequestException)
        e.message == "Unknown symbol 'ZZZ'"
    }

    def 'a hypothetical portfolio takes {holdings: [{symbol, weight}]}'() {
        expect:
        rows(dataset: 'hypotheticalPortfolio',
             params: [asOf: D4.toString(), portfolio: [holdings: [[symbol: 'AAA', weight: 0.6], [symbol: bond.symbol, weight: 0.4]]]],
             fields: ['symbol', 'weight', 'mktVal', [name: 'down10', field: 'shockedPnl', params: [shock: -0.1]]]) == [
            [id: 'AAA', symbol: 'AAA', weight: 0.6d, mktVal: 60_000_000, down10: -7_200_000],
            [id: bond.symbol, symbol: bond.symbol, weight: 0.4d, mktVal: 40_000_000, down10: -400_000]
        ]
    }

    def 'a malformed portfolio is an error that names the problem'() {
        when:
        rows(dataset: 'hypotheticalPortfolio', params: [asOf: D4.toString(), portfolio: portfolio], fields: ['mktVal'])

        then:
        def e = thrown(BlueprintRequestException)
        e.message.startsWith(message)

        where:
        portfolio                                                             || message
        [[symbol: 'AAA', weight: 1]]                                          || "Parameter 'portfolio' must be {holdings: [{symbol, weight}]}"
        [holdings: [[symbol: 'ZZZ', weight: 1]]]                              || "Unknown symbol 'ZZZ' in portfolio"
        [holdings: [[symbol: 'AAA', weight: '50%']]]                          || "Holding 'AAA' needs a numeric weight, got '50%'"
        [holdings: [[symbol: 'AAA', weight: 0.5], [symbol: 'AAA', weight: 0.5]]] || "Symbol 'AAA' appears more than once in portfolio"
    }

    def 'an unknown fund is an error'() {
        when:
        service.parseRequest(dataset: 'positions', params: [asOf: D4.toString(), fund: 'Nope'])

        then:
        def e = thrown(BlueprintRequestException)
        e.message.startsWith("Unknown fund 'Nope'")
    }

    def 'live requests are those whose rows can still change'() {
        given:
        def ds = datasets()

        expect:
        service.isLive(service.parseRequest(dataset: 'positions', params: [asOf: D4.toString()]), ds)
        !service.isLive(service.parseRequest(dataset: 'positions', params: [asOf: D3.toString()]), ds)
        !service.isLive(service.parseRequest(dataset: 'orders', params: [asOf: D2.toString()]), ds)
    }

    def 'the catalog is served as stored'() {
        expect:
        service.catalogJson.label == 'Portfolio'
        service.catalogJson.datasets.keySet() as List == ['positions', 'orders', 'prices', 'hypotheticalPortfolio']
    }
}
