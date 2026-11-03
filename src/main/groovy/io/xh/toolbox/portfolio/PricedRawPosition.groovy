package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormat

class PricedRawPosition implements JSONFormat{

    final RawPosition rawPosition
    final Double endPx
    final Long mktVal
    final Long pnl
    final Long dayPnl

    PricedRawPosition(RawPosition rawPosition, MarketPrice price) {
        this.rawPosition = rawPosition
        this.endPx = price?.close
        if (endPx != null) {
            mktVal = (rawPosition.endQty * endPx).round()
            pnl = mktVal - rawPosition.cost
            dayPnl = (rawPosition.endQty * (endPx - price.open)).round()
        }
    }

    Long getLongMktVal() { mktVal > 0 ? mktVal : 0 }
    Long getShortMktVal() { mktVal < 0 ? mktVal : 0 }
    Long getCost() { rawPosition.cost }
    Long getCommission() { rawPosition.commission }

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
