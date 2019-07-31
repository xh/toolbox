package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

import java.time.Instant

class Order extends JSONFormatCached {
    String id
    Instrument instrument
    String dir
    long quantity
    double price
    long mktVal
    long commission
    int confidence

    Instant time

    String model
    String trader
    String fund

    String getKey() { [getSymbol(), trader, model, fund].join('||') }

    String getRegion() { instrument.region }

    String getSector() { instrument.sector }

    String getSymbol() { instrument.symbol }

    Map formatForJSON() {
        return [
                id        : id,
                symbol    : symbol,
                sector    : sector,
                region    : region,
                dir       : dir,
                quantity  : quantity,
                price     : price,
                mktVal    : mktVal,
                time      : time,
                commission: commission,
                confidence: confidence,
                model     : model,
                trader    : trader,
                fund      : fund
        ]
    }
}
