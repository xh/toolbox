package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class RawPosition extends JSONFormatCached {
    Instrument instrument
    String model
    String fund
    String trader
    long mktVal
    long pnl

    String getRegion() { instrument.region }

    String getSector() { instrument.sector }

    String getSymbol() { instrument.symbol }

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
