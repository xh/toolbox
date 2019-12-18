package io.xh.toolbox.portfolio

import java.time.LocalDate

class PortfolioDataSet {

    LocalDate day
    Date timeCreated = new Date()

    // Market Data
    // Map of symbol to instrument, marketPrices
    Map<String, Instrument> instruments
    Map<String, List<MarketPrice>> historicalPrices
    Map<String, MarketPrice> intradayPrices

    // Fund positioning/data
    List<Order> orders
    List<RawPosition> rawPositions
}
