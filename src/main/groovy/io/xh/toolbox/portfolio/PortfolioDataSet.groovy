package io.xh.toolbox.portfolio

class PortfolioDataSet {

    // Market Data
    // Map of symbol to instrument, marketPrices
    Map<String, Instrument> instruments
    Map<String, List<MarketPrice>> marketPrices

    // Fund positioning/data
    List<Order> orders
    List<RawPosition> rawPositions
}
