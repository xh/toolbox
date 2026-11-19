package io.xh.toolbox.portfolio

/**
 * Instrument types in the simulated portfolio, with the pricing and sizing that differ by type.
 * Market value is `quantity * price * multiplier`.
 */
enum InstrumentType {
    //      assetClass      mult  startPx    vol   order qty
    Equity('Equity',        1,    10, 500,   1.0,  300, 10000),
    Option('Equity',        100,  1, 30,     2.0,  10, 500),
    Future('Equity',        50,   20, 500,   1.0,  5, 200),
    Bond('Fixed Income',    10,   85, 110,   0.1,  50, 2000),
    FX('FX',                1000, 0.5, 1.5,  0.25, 100, 5000)

    final String assetClass
    final int multiplier
    final double minStartPx, maxStartPx
    /** Scales the daily moves of the simulated price walk. */
    final double vol
    final int minOrderQty, maxOrderQty

    InstrumentType(
        String assetClass,
        int multiplier,
        double minStartPx,
        double maxStartPx,
        double vol,
        int minOrderQty,
        int maxOrderQty
    ) {
        this.assetClass = assetClass
        this.multiplier = multiplier
        this.minStartPx = minStartPx
        this.maxStartPx = maxStartPx
        this.vol = vol
        this.minOrderQty = minOrderQty
        this.maxOrderQty = maxOrderQty
    }
}
