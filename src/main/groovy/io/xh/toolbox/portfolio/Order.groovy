package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

import java.time.Instant

class Order extends JSONFormatCached {
    String id
    String symbol
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

    Map formatForJSON() {
        return [
                id        : id,
                symbol    : symbol,
                dir       : dir,
                quantity  : quantity,
                price     : price,
                mktVal    : mktVal,
                time      : time,
                commission: commission,
                confidence: confidence,
                model:      model,
                trader:     trader,
                fund:       fund
        ]
    }
}
