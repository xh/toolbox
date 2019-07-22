package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

import java.time.LocalDateTime

class Order extends JSONFormatCached {
    String id
    String posId
    String symbol
    String dir
    long quantity
    double price
    long mktVal
    LocalDateTime time
    Position position
    long commission
    int confidence

    Map formatForJSON() {
        return [
                id        : id,
                posId     : posId,
                symbol    : symbol,
                dir       : dir,
                quantity  : quantity,
                price     : price,
                mktVal    : mktVal,
                time      : time,
                position  : position,
                commission: commission,
                confidance: confidence
        ]
    }
}
