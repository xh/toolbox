package io.xh.toolbox.blueprints

import grails.testing.services.ServiceUnitTest
import io.xh.toolbox.portfolio.PortfolioDatasets
import io.xh.toolbox.weather.OpenWeatherRowsSpec
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

import static io.xh.toolbox.portfolio.PortfolioFixture.*

class BlueprintDataServiceSpec extends Specification implements ServiceUnitTest<BlueprintDataService>, HoistUnitTest {

    private static Map bySymbol(List<Map> rows, String symbol) { rows.find { it.symbol == symbol } }

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

    def 'server fields roll up per grouping set and for the total, named by request column'() {
        given:
        def ds = datasets()
        def leaves = ds.positions(D4)
        def navs = PortfolioDatasets.navsByFund(leaves)

        when:
        def result = service.query(service.parseRequest(
            dataset: 'positions',
            params : [asOf: D4.toString()],
            fields : ['fund', 'symbol', 'mktVal', 'var95', 'pctNav', [name: 'ret', field: 'return', params: [start: D1.toString(), end: D4.toString()]]],
            groupBy: [[], ['fund'], ['fund', 'symbol']]
        ), ds)
        def byDims = result.aggregates.collectEntries { [it.dims, it.values] }

        then:
        result.rows.size() == 3
        result.aggregates.size() == 1 + 2 + 3
        byDims.keySet() == [[:], [fund: F1], [fund: F2], [fund: F1, symbol: 'AAA'], [fund: F1, symbol: bond.symbol], [fund: F2, symbol: opt.symbol]] as Set
        byDims[[:]].keySet() as List == ['var95', 'pctNav', 'ret']
        byDims[[:]].var95 == ds.groupVar(leaves, D4, PortfolioDatasets.Z95)
        byDims[[fund: F1]].pctNav == PortfolioDatasets.groupPctNav(leaves.findAll { it.fund == F1 }, navs)
        byDims[[fund: F1]].pctNav == 121600 / 59000d
        byDims[[fund: F2, symbol: opt.symbol]].ret == ds.groupReturn([bySymbol(leaves, opt.symbol)], D1, D4)
        Math.abs(byDims[[fund: F1, symbol: 'AAA']].var95 - bySymbol(leaves, 'AAA').var95) <= 1
    }

    def 'aggregates cover the filtered leaves, keep fund NAVs whole, and give empty dimensions as null'() {
        given:
        def ds = datasets()
        def leaves = ds.positions(D4)

        when:
        def aggs = service.query(service.parseRequest(
            dataset: 'positions',
            params : [asOf: D4.toString()],
            fields : ['var95', 'pctNav'],
            groupBy: [[], ['underlying']],
            filter : [field: 'instrumentType', op: '!=', value: 'Bond']
        ), ds).aggregates
        def total = aggs.find { it.dims == [:] }

        then:
        total.values.pctNav == 24400 / 60200d
        total.values.var95 == ds.groupVar(leaves.findAll { it.instrumentType != 'Bond' }, D4, PortfolioDatasets.Z95)
        aggs*.dims.toSet() == [[:], [underlying: null], [underlying: 'AAA']] as Set
    }

    def 'aggregates are sent only for a server field and a grouping set'() {
        given:
        def ds = datasets()
        def base = [dataset: 'positions', params: [asOf: D4.toString()]]

        expect:
        service.query(service.parseRequest(base + [fields: ['mktVal'], groupBy: [[]]]), ds).aggregates == null
        service.query(service.parseRequest(base + [fields: ['var95'], groupBy: []]), ds).aggregates == null
        service.query(service.parseRequest(base + [fields: ['var95']]), ds).formatForJSON().keySet() == ['rows'] as Set
        service.query(service.parseRequest(base + [fields: ['var95'], groupBy: [[]]]), ds).formatForJSON().keySet() == ['rows', 'aggregates'] as Set
    }

    def 'fund summary and position series route through requested fields'() {
        given:
        def ds = datasets()

        expect:
        service.getRows(service.parseRequest(dataset: 'fundSummary', params: [asOf: D4.toString()], fields: ['fund', 'pnlDay', 'cumPnlHistory']), ds)
            .find { it.fund == F1 } == [id: F1, fund: F1, pnlDay: 2300L, cumPnlHistory: [0L, 1000L, 2000L, 4300L]]
        service.getRows(service.parseRequest(dataset: 'positions', params: [asOf: D4.toString(), fund: F1], fields: ['symbol', 'closeHistory']), ds)
            .find { it.symbol == 'AAA' }.closeHistory == [100d, 110d, 120d, 135d]
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

    def 'prices without a symbol serve every symbol, filtered before the row cap'() {
        given:
        service.maxRows.prices = 4
        Map spec = [dataset: 'prices', params: [start: D3.toString(), end: D4.toString()], fields: ['symbol', 'close']]

        expect:
        rows(spec + [filter: [field: 'symbol', op: '=', value: ['AAA', 'AAA MAR26 C']]])*.close == [120d, 135d, 12d, 14d]

        when:
        rows(spec)

        then:
        def e = thrown(BlueprintRequestException)
        e.message == 'prices would return 6 rows, over its limit of 4. Rows are symbols times trading days: name a symbol, filter by symbol, or shorten the window.'

        cleanup:
        service.maxRows.prices = BlueprintDataService.MAX_ROWS.prices
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

    def 'symbols list every priceable instrument with its name and sector, by symbol'() {
        expect:
        datasets().symbols() == [
            [symbol: 'AAA', name: 'AAA Inc', sector: 'Technology'],
            [symbol: 'AAA 5.0 2030', name: 'AAA Inc 5.0% 2030', sector: 'Technology'],
            [symbol: 'AAA MAR26 C', name: 'AAA Inc MAR26 Call', sector: 'Technology']
        ]
        datasets().symbols()*.symbol.every { rows(dataset: 'hypotheticalPortfolio', params: [asOf: D4.toString(), portfolio: [holdings: [[symbol: it, weight: 1]]]], fields: ['mktVal']).size() == 1 }
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

        then: 'the forecast only for the forecast, as tempNext24h was not requested'
        calls == [['forecast', 'London', 'metric'], ['current', 'London', 'imperial']]

        when:
        calls.clear()
        def withSeries = service.getRows(service.parseRequest(
            dataset: 'currentWeather', params: [city: 'London', units: 'metric'], fields: ['tempNext24h']
        ))

        then:
        calls == [['current', 'London', 'metric'], ['forecast', 'London', 'metric']]
        withSeries == [[id: 'London', tempNext24h: [7.42, 6.1]]]
        forecast == [
            [id: 'London|1795057200000', day: '2026-11-19', temp: 7.42, precipProbability: 0.62],
            [id: 'London|1795068000000', day: '2026-11-19', temp: 6.1, precipProbability: 0]
        ]
        current == [[id: 'London', conditions: 'Clouds']]
    }

    def 'pnlHistory serves its rows, and refuses more than its row cap'() {
        given:
        Map spec = [dataset: 'pnlHistory', params: [asOf: D4.toString()], fields: ['day', 'fund', 'sector', 'pnlDay', 'cumPnl']]

        expect:
        rows(spec).every { it.sector == 'Technology' }
        rows(spec)*.fund.unique().sort() == [F2, F1].sort()
        rows(spec + [dataset: 'pnlBySector']).every { it.sector == 'Technology' && it.pnlDay != null }

        when:
        service.maxRows.pnlHistory = 1
        rows(spec)

        then:
        def e = thrown(BlueprintRequestException)
        e.message.startsWith('pnlHistory would return')
        e.message.endsWith('name a fund, filter by sector or symbol, or shorten the window.')

        cleanup:
        service.maxRows.pnlHistory = BlueprintDataService.MAX_ROWS.pnlHistory
    }

    def 'the catalog merges the portfolio and weather catalogs'() {
        expect:
        service.catalogJson.label == 'Toolbox'
        service.catalogJson.datasets.keySet() as List == ['positions', 'fundSummary', 'pnlHistory', 'pnlBySector', 'orders', 'prices', 'hypotheticalPortfolio', 'weather', 'currentWeather']
    }

    def 'weather datasets serve seeded rows without an API key, never live'() {
        given:
        useAppTimeZone('UTC')
        service.weatherService = [configured: false]

        when:
        def forecast = service.getRows(service.parseRequest(
            dataset: 'weather', params: [city: 'Paris', units: 'metric'], fields: ['time', 'day', 'temp', 'conditions']
        ))
        def current = service.getRows(service.parseRequest(
            dataset: 'currentWeather', params: [city: 'Paris', units: 'imperial'], fields: ['city', 'temp']
        ))

        then:
        forecast.size() == 40
        forecast[0].keySet() as List == ['id', 'time', 'day', 'temp', 'conditions']
        forecast[0].id == "Paris|${forecast[0].time}"
        current.size() == 1
        current[0].keySet() as List == ['id', 'city', 'temp']
        !service.isLive(service.parseRequest(dataset: 'weather', params: [city: 'Paris', units: 'metric']))
    }
}
