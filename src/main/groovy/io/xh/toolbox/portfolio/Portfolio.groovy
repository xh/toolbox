package io.xh.toolbox.portfolio

import java.time.LocalDate

class Portfolio {

    LocalDate day
    Date timeCreated = new Date()

    // Market Data
    // Map of symbol to instrument, marketPrices
    Map<String, Instrument> instruments
    Map<String, List<MarketPrice>> historicalPrices
    /** Days covered by every series in historicalPrices, ascending. The last is the live day. */
    List<LocalDate> tradingDays

    // Fund positioning/data
    List<Order> orders
    List<RawPosition> rawPositions
}