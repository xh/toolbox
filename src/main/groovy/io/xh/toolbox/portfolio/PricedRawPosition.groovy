package io.xh.toolbox.portfolio

class PricedRawPosition {

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
}
