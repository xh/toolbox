package io.xh.toolbox.portfolio

import spock.lang.Specification

import java.time.Instant
import java.time.LocalDate

import static io.xh.toolbox.portfolio.PortfolioFixture.*

class PortfolioDatasetsSpec extends Specification {

    private static boolean near(Double a, double b) { Math.abs(a - b) < 1e-9 }

    private static Map bySymbol(List<Map> rows, String symbol) { rows.find { it.symbol == symbol } }

    def 'live positions price at current prices and hold only orders already placed'() {
        when:
        def rows = datasets().positions(D4)
        def aaa = bySymbol(rows, 'AAA')

        then:
        rows.size() == 3
        aaa.id == 'Oak Mount|Credit|Core|T|M|AAA'
        aaa.quantity == 160
        aaa.price == 135
        aaa.mktVal == 21600
        aaa.pnlDay == 2300      // 4300 now, less 2000 at D3's close
        aaa.pnlMtd == 3300      // less 1000 at the close of Dec 31
        aaa.pnlYtd == 3300
        aaa.netExposure == 21600
        aaa.betaAdjExposure == 25920
        aaa.var95 > 0 && aaa.var99 > aaa.var95
        aaa.delta == null && aaa.duration == null
        aaa.sector == 'Technology' && aaa.assetClass == 'Equity' && aaa.instrumentType == 'Equity'
    }

    def 'later orders on the live day appear once their time passes'() {
        expect:
        bySymbol(datasets(Instant.parse('2026-01-05T21:00:00Z')).positions(D4), 'AAA').quantity == 170
    }

    def 'when the app day runs ahead of the exchange, the live day holds no orders until their time'() {
        given: 'the evening of Jan 4 in New York, already Jan 5 - the app day - in UTC'
        def ds = datasets(Instant.parse('2026-01-05T01:00:00Z'))

        expect:
        ds.isLivePositions(D4)
        ds.isLiveOrders(D4)
        ds.orders(D4) == []
        bySymbol(ds.positions(D4), 'AAA').quantity == 150
        bySymbol(ds.positions(D4), 'AAA').pnlDay == 150 * 15     // D3 holdings repriced 120 -> 135
        ds.positions(D4.plusDays(1)) == ds.positions(D4)
    }

    def 'Greeks are set on options only, from underlying notional'() {
        when:
        def o = bySymbol(datasets().positions(D4), opt.symbol)

        then:
        o.mktVal == 2800
        o.delta == 13500        // 2 * 100 * 135 * 0.5
        o.gamma == 14           // 27000 * 0.05 * 0.01, rounded
        o.vega == 54
        o.theta == -14
        o.netExposure == 13500
        o.notional == 27000
        o.underlying == 'AAA'
    }

    def 'duration, DV01 and yield are set on bonds only'() {
        when:
        def b = bySymbol(datasets().positions(D4), bond.symbol)

        then:
        b.mktVal == 100000
        b.duration == 4
        b.dv01 == 40
        b.yield == 0.05
        b.delta == null
    }

    def 'pctNav weighs each position against half its fund gross'() {
        when:
        def rows = datasets().positions(D4)

        then:
        bySymbol(rows, 'AAA').pctNav == 21600 / 60800d
        bySymbol(rows, opt.symbol).pctNav == 2
    }

    def 'funds carry the AUM that pctNav weighs against'() {
        when:
        def funds = datasets().funds()

        then:
        funds*.name == Lookups.FUNDS
        funds.find { it.name == F1 }.aum == 60800
        funds.find { it.name == F2 }.aum == 1400
        funds.find { it.name == 'Hudson Bay' }.aum == 0
    }

    def 'asOf changes the data, and resolves to the last trading day on or before it'() {
        given:
        def ds = datasets()

        when:
        def aaa = bySymbol(ds.positions(D2), 'AAA')

        then:
        aaa.quantity == 100
        aaa.mktVal == 11000
        aaa.pnlDay == 1000
        aaa.pnlMtd == 1000      // no history before Dec 1
        ds.positions(D2).size() == 3
        ds.positions(D1).size() == 1

        and:
        ds.positions(LocalDate.of(2026, 1, 3)) == ds.positions(D3)
        ds.positions(LocalDate.of(2026, 2, 1)) == ds.positions(D4)
        ds.positions(LocalDate.of(2025, 1, 1)) == []
        !ds.isLivePositions(D3)
        ds.isLivePositions(LocalDate.of(2026, 2, 1))
    }

    def 'the fund parameter limits positions and orders to one fund'() {
        given:
        def ds = datasets()

        expect:
        ds.positions(D4, F2)*.symbol == [opt.symbol]
        ds.orders(D2, F1)*.orderId == ['o6']
    }

    def 'orders are those on the literal asOf date, up to now on the live day'() {
        given:
        def ds = datasets()

        expect:
        ds.orders(D4)*.id == ['o3']
        ds.orders(D2)*.id == ['o5', 'o6']
        ds.orders(LocalDate.of(2026, 1, 3)) == []

        when:
        def o = ds.orders(D2)[0]

        then:
        o.mktVal == 2200
        o.dir == 'Buy'
        o.time == Instant.parse('2025-12-31T15:00:00Z').toEpochMilli()
        o.assetClass == 'Equity' && o.instrumentType == 'Option'
    }

    def 'prices are one row per trading day in the window, the live day at current prices'() {
        given:
        def ds = datasets()

        when:
        def rows = ds.prices('AAA', D2, LocalDate.of(2026, 2, 1))

        then:
        rows*.day == [D2, D3, D4]*.toString()
        rows*.close == [110d, 120d, 135d]
        rows[0].id == "AAA|$D2"
        ds.prices('AAA', D1, D1)*.close == [100d]
        ds.prices('AAA', D3, D2) == []
        ds.isLivePrices(D1, D4)
        !ds.isLivePrices(D1, D3)
    }

    def 'a hypothetical portfolio sizes each holding as its weight of the notional'() {
        given:
        def ds = datasets()

        when:
        def rows = ds.hypotheticalPortfolio([['AAA', 0.6], [opt.symbol, -0.1]], D4)
        def aaa = rows[0], o = rows[1]

        then:
        rows*.id == ['AAA', opt.symbol]
        aaa.mktVal == 60_000_000
        aaa.weight == 0.6d
        aaa.price == 135
        aaa.betaAdjExposure == 72_000_000
        aaa.sector == 'Technology'
        o.mktVal == -10_000_000
        o.delta == Math.round(-10_000_000 / 1400 * 100 * 135 * 0.5)
        ds.shockedPnlFor(aaa, -0.1) == -7_200_000

        and:
        ds.hypotheticalPortfolio([['AAA', 1]], LocalDate.of(2020, 1, 1)) == []
    }

    def 'return is the price return over the window, signed by direction'() {
        given:
        def ds = datasets()

        expect:
        near(ds.returnFor([symbol: 'AAA', quantity: 10], D1, D3), 0.2)
        near(ds.returnFor([symbol: 'AAA', quantity: -10], D1, D3), -0.2)
        near(ds.returnFor([symbol: 'AAA', quantity: 10], D1, D4), 0.35)
        ds.returnFor([symbol: 'AAA', quantity: 10], LocalDate.of(2020, 1, 1), D3) == null
    }

    def "group VaR comes from the group's combined P&L, and equals a lone row's own VaR"() {
        given:
        def ds = datasets()
        def rows = ds.positions(D4)
        def aaa = bySymbol(rows, 'AAA'), o = bySymbol(rows, opt.symbol)

        expect: 'one row reproduces its leaf value'
        Math.abs(ds.groupVar([aaa], D4, PortfolioDatasets.Z95) - aaa.var95) <= 1
        Math.abs(ds.groupVar([o], D4, PortfolioDatasets.Z99) - o.var99) <= 1

        and: 'the option moves with its underlying, so the two add up'
        Math.abs(ds.groupVar([aaa, o], D4, PortfolioDatasets.Z95) - (aaa.var95 + o.var95)) <= 2

        and: 'offsetting exposures to one instrument cancel, which a sum of leaves would miss'
        ds.groupVar([[symbol: 'AAA', instrumentType: 'Equity', netExposure: 1000], [symbol: 'AAA', instrumentType: 'Equity', netExposure: -1000]], D4, PortfolioDatasets.Z95) == 0
        ds.groupVar([], D4, PortfolioDatasets.Z95) == null
    }

    def 'group return is window P&L per unit of gross value at the start'() {
        given:
        def ds = datasets()
        def rows = ds.positions(D4)
        def aaa = bySymbol(rows, 'AAA'), o = bySymbol(rows, opt.symbol)

        expect:
        near(ds.groupReturn([aaa], D1, D3), ds.returnFor(aaa, D1, D3))
        near(ds.groupReturn([aaa, o], D1, D4), (160 * 35 + 2 * 100 * 4) / (160 * 100 + 2 * 100 * 10d))
        ds.groupReturn([aaa], LocalDate.of(2020, 1, 1), D3) == null
    }

    def 'group pctNav weighs a group against the NAV of the funds it holds'() {
        given:
        def rows = datasets().positions(D4)
        def navs = PortfolioDatasets.navsByFund(rows)
        def aaa = bySymbol(rows, 'AAA'), o = bySymbol(rows, opt.symbol), b = bySymbol(rows, bond.symbol)

        expect:
        navs == [(F1): 60800d, (F2): 1400d]
        PortfolioDatasets.groupPctNav([aaa], navs) == aaa.pctNav
        PortfolioDatasets.groupPctNav([aaa, b], navs) == 2d
        PortfolioDatasets.groupPctNav([aaa, o], navs) == 24400 / 62200d
    }

    def 'shocked P&L is beta-adjusted, with convexity on options'() {
        given:
        def ds = datasets()
        def rows = ds.positions(D4)

        expect:
        ds.shockedPnlFor(bySymbol(rows, 'AAA'), -0.1) == -2592
        ds.shockedPnlFor(bySymbol(rows, opt.symbol), -0.1) == -1343   // -1350 delta, +7 gamma
    }
}
