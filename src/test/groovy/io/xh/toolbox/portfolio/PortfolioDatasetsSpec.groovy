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

    def 'return is the price return over the window, signed by direction'() {
        given:
        def ds = datasets()

        expect:
        near(ds.returnFor([symbol: 'AAA', quantity: 10], D1, D3), 0.2)
        near(ds.returnFor([symbol: 'AAA', quantity: -10], D1, D3), -0.2)
        near(ds.returnFor([symbol: 'AAA', quantity: 10], D1, D4), 0.35)
        ds.returnFor([symbol: 'AAA', quantity: 10], LocalDate.of(2020, 1, 1), D3) == null
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
