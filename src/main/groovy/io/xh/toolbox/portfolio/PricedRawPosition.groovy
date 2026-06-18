package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormat

class PricedRawPosition implements JSONFormat{

    final RawPosition rawPosition
    final Double endPx
    final Long mktVal
    final Long pnl

    PricedRawPosition(RawPosition rawPosition, Double endPx) {
        this.rawPosition = rawPosition
        this.endPx = endPx
        if (endPx != null) {
            mktVal = (rawPosition.endQty * endPx).round()
            pnl = mktVal - rawPosition.cost
        }
    }

    Map formatForJSON() {
        return [
                symbol: rawPosition.symbol,
                model : rawPosition.model,
                fund  : rawPosition.fund,
                sector: rawPosition.instrument.sector,
                region: rawPosition.instrument.region,
                trader: rawPosition.trader,
                mktVal: mktVal,
                pnl: pnl
        ]
    }
}
