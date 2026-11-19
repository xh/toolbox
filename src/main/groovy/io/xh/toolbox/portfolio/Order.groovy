package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

import java.time.Instant
import java.time.LocalDate

class Order extends JSONFormatCached {
    String id
    Instrument instrument
    String dir
    Long quantity
    Double price
    Long cost
    Long mktVal
    Long commission
    Integer confidence

    Instant time
    /** Trading day of the order, in the exchange's zone. */
    LocalDate day

    String model
    String trader
    String fund
    String strategy
    String book

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
