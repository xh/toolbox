package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class RawPosition extends JSONFormatCached {

    // Core position
    final Instrument instrument
    final String model
    final String fund
    final String trader
    final Long cost
    final Long endQty
    final String comment

    // Pricing related
    final Double endPx
    final Long mktVal
    final Long pnl

    String getRegion() { instrument.region }
    String getSector() { instrument.sector }
    String getSymbol() { instrument.symbol }

    RawPosition(Map mp) {
        instrument = mp.instrument
        model = mp.model
        fund = mp.fund
        trader = mp.trader
        cost = mp.cost as Long
        endQty = mp.endQty as Long
        endPx = mp.endPx as Double
        mktVal = (endQty * endPx).round()
        pnl = mktVal - cost
        comment = mp.comment
    }


    RawPosition repricePosition(Double endPx) {
        return new RawPosition(
                instrument: this.instrument,
                model: this.model,
                fund: this.fund,
                trader: this.trader,
                cost: this.cost,
                endQty: this.endQty,
                endPx: endPx
        )
    }


    Map formatForJSON() {
        return [
                symbol : symbol,
                model  : model,
                fund   : fund,
                trader : trader,
                mktVal : mktVal,
                pnl    : pnl,
                comment: comment
        ]
    }
}
