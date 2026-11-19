package io.xh.toolbox.portfolio

import java.time.Instant
import java.time.LocalDate

import static io.xh.toolbox.portfolio.InstrumentType.*

/** A small hand-built portfolio with known prices and orders. */
class PortfolioFixture {

    static final LocalDate D1 = LocalDate.of(2025, 12, 30),
                           D2 = LocalDate.of(2025, 12, 31),
                           D3 = LocalDate.of(2026, 1, 2),   // Friday
                           D4 = LocalDate.of(2026, 1, 5)    // Monday, the live day

    static final String F1 = 'Oak Mount', F2 = 'Black Crescent'

    static final Instant NOON_D4 = Instant.parse('2026-01-05T17:00:00Z')

    static final Instrument eq = new Instrument(symbol: 'AAA', type: Equity, sector: 'Technology', industry: 'Software',
        region: 'US', country: 'United States', ccy: 'USD', issuer: 'AAA Inc', isin: 'US0000000001', beta: 1.2)
    static final Instrument opt = new Instrument(symbol: 'AAA MAR26 C', type: Option, sector: 'Technology', underlying: 'AAA',
        beta: 1.2, deltaRatio: 0.5, gammaRatio: 0.05, vegaRatio: 0.002, thetaRatio: 0.0005)
    static final Instrument bond = new Instrument(symbol: 'AAA 5.0 2030', type: Bond, sector: 'Technology', issuer: 'AAA Inc',
        beta: 0.1, coupon: 0.05, duration: 4)

    static Portfolio portfolio() {
        def days = [D1, D2, D3, D4]
        def series = { List<Double> closes -> [days, closes].transpose().collect { d, c -> new MarketPrice(day: d, close: c) } }
        return new Portfolio(
            day: D4,
            tradingDays: days,
            instruments: [eq, opt, bond].collectEntries { [it.symbol, it] },
            historicalPrices: [
                (eq.symbol)  : series([100d, 110d, 120d, 130d]),
                (opt.symbol) : series([10d, 11d, 12d, 13d]),
                (bond.symbol): series([100d, 100d, 100d, 100d])
            ],
            orders: [
                order('o1', eq, F1, D1, '15:00', 100, 100),
                order('o5', opt, F2, D2, '15:00', 2, 11),
                order('o6', bond, F1, D2, '16:00', 100, 100),
                order('o2', eq, F1, D3, '15:00', 50, 120),
                order('o3', eq, F1, D4, '15:00', 10, 130),
                order('o4', eq, F1, D4, '20:00', 10, 131)
            ]
        )
    }

    static PortfolioDatasets datasets(Instant now = NOON_D4) {
        new PortfolioDatasets(portfolio(), currentPrices(), now)
    }

    static Map<String, MarketPrice> currentPrices() {
        [
            (eq.symbol)  : new MarketPrice(day: D4, close: 135),
            (opt.symbol) : new MarketPrice(day: D4, close: 14),
            (bond.symbol): new MarketPrice(day: D4, close: 100)
        ]
    }

    private static Order order(String id, Instrument inst, String fund, LocalDate day, String utcTime, long qty, double px) {
        long cost = Math.round(qty * px * inst.multiplier)
        new Order(id: id, instrument: inst, fund: fund, strategy: 'Credit', book: 'Core', trader: 'T', model: 'M',
            dir: qty < 0 ? 'Sell' : 'Buy', day: day, time: Instant.parse("${day}T${utcTime}:00Z"),
            quantity: qty, price: px, cost: cost, mktVal: cost, commission: 1, confidence: 50)
    }

}
