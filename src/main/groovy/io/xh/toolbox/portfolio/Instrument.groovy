package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class Instrument extends JSONFormatCached {
    String symbol
    InstrumentType type
    String sector
    String industry
    String region
    String country
    String ccy
    String issuer
    /** Underlying equity symbol - options and futures only. */
    String underlying
    String isin
    /** North American instruments only. */
    String cusip
    double beta

    // Options only, as fractions of underlying notional. Delta is negative for puts.
    Double deltaRatio
    Double gammaRatio
    Double vegaRatio
    Double thetaRatio

    // Bonds only
    Double coupon
    Double duration

    String getAssetClass()      { type.assetClass }
    String getInstrumentType()  { type.name() }
    int getMultiplier()         { type.multiplier }

    Map formatForJSON() {
        return [
            symbol        : symbol,
            assetClass    : assetClass,
            instrumentType: instrumentType,
            sector        : sector,
            industry      : industry,
            region        : region,
            country       : country,
            ccy           : ccy,
            issuer        : issuer,
            underlying    : underlying,
            isin          : isin,
            cusip         : cusip
        ]
    }
}
