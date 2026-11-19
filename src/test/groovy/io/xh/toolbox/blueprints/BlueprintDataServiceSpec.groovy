package io.xh.toolbox.blueprints

import grails.testing.services.ServiceUnitTest
import io.xh.toolbox.weather.OpenWeatherRowsSpec
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

    def 'weather datasets map OpenWeatherMap data, in the requested units, when an API key is set'() {
        given:
        useAppTimeZone('UTC')
        List calls = []
        service.weatherService = [
            configured       : true,
            getForecast      : { String city, String units -> calls << ['forecast', city, units]; OpenWeatherRowsSpec.FORECAST },
            getCurrentWeather: { String city, String units -> calls << ['current', city, units]; OpenWeatherRowsSpec.CURRENT }
        ]

        when:
        def forecast = service.getRows(service.parseRequest(
            dataset: 'weather', params: [city: 'London', units: 'metric'], fields: ['day', 'temp', 'precipProbability']
        ))
        def current = service.getRows(service.parseRequest(
            dataset: 'currentWeather', params: [city: 'London', units: 'imperial'], fields: ['conditions']
        ))

        then:
        calls == [['forecast', 'London', 'metric'], ['current', 'London', 'imperial']]
        forecast == [
            [id: 'London|1795057200000', day: '2026-11-19', temp: 7.42, precipProbability: 0.62],
            [id: 'London|1795068000000', day: '2026-11-19', temp: 6.1, precipProbability: 0]
        ]
        current == [[id: 'London', conditions: 'Clouds']]
    }

    def 'the catalog merges the portfolio and weather catalogs'() {
        expect:
        service.catalogJson.label == 'Toolbox'
        service.catalogJson.datasets.keySet() as List == ['positions', 'orders', 'prices', 'hypotheticalPortfolio', 'weather', 'currentWeather']
    }

    def 'weather datasets serve seeded rows without an API key, never live'() {
        given:
        useAppTimeZone('UTC')
        service.weatherService = [configured: false]

        when:
        def forecast = service.getRows(service.parseRequest(
            dataset: 'weather', params: [city: 'Oslo', units: 'metric'], fields: ['time', 'day', 'temp', 'conditions']
        ))
        def current = service.getRows(service.parseRequest(
            dataset: 'currentWeather', params: [city: 'Oslo', units: 'imperial'], fields: ['city', 'temp']
        ))

        then:
        forecast.size() == 40
        forecast[0].keySet() as List == ['id', 'time', 'day', 'temp', 'conditions']
        forecast[0].id == "Oslo|${forecast[0].time}"
        current.size() == 1
        current[0].keySet() as List == ['id', 'city', 'temp']
        !service.isLive(service.parseRequest(dataset: 'weather', params: [city: 'Oslo', units: 'metric']))
    }
}
