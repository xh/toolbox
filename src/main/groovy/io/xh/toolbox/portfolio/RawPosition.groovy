package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormat

class RawPosition {

    // Core position
    final Instrument instrument
    final String model
    final String fund
    final String trader
    final Long cost
    final Long endQty
    final Long commission

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
        commission = mp.commission as Long
    }

}
