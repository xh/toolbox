package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class Position extends JSONFormatCached {
    String id
    String symbol
    String model
    String fund
    String trader

    Map formatForJSON() {
        return [
                id    : id,
                symbol: symbol,
                model : model,
                fund  : fund,
                trader: trader
        ]
    }
}
