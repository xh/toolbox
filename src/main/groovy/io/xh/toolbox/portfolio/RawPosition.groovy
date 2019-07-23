package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class RawPosition extends JSONFormatCached {
    String symbol
    String model
    String fund
    String trader
    long mktVal
    long pnl

    Map formatForJSON() {
        return [
                symbol: symbol,
                model : model,
                fund  : fund,
                trader: trader,
                mktVal: mktVal,
                pnl   : pnl
        ]
    }
}
