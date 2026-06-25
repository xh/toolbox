package io.xh.toolbox.portfolio

import io.xh.hoist.config.TypedConfigMap

/**
 * Typed representation of the `portfolioConfigs` soft config - tuning parameters for the simulated
 * portfolio dataset and its live price/order update loop.
 *
 * Read server-side via `configService.getObject(PortfolioConfig)` by {@link PortfolioService},
 * {@link PositionService}, and the generation services under `portfolio.generation`.
 */
class PortfolioConfig extends TypedConfigMap {

    /** Number of distinct instruments to generate for the simulated portfolio. */
    Integer instrumentCount = 500

    /** Number of orders to generate across the simulated trading day. */
    Integer orderCount = 20000

    /** Interval (secs) between simulated price/quantity updates to the portfolio. */
    Integer updateIntervalSecs = 5

    /** Percentage of instruments to re-price on each update tick. */
    Integer updatePctInstruments = 20

    /** Maximum fractional price move applied on each update (e.g. 0.025 == +/-2.5%). */
    Double updatePctPriceRange = 0.025

    /** Interval (secs) between pushes of updated portfolio data to connected clients. */
    Integer pushUpdatesIntervalSecs = 5

    PortfolioConfig(Map args) { init(args) }
}
