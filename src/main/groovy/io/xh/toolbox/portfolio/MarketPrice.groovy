package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

import java.time.LocalDate
import static Utils.randDouble

class MarketPrice extends JSONFormatCached {
    LocalDate day
    double high
    double low
    double open
    double close
    long volume


    MarketPrice perturb(double pctRange) {
        int sign = Math.random() > 0.5 ? 1 : -1
        double pctChange = randDouble(0, pctRange)
        double newClose = close * (1+(sign*pctChange/100))
        double newHigh = newClose > high ? newClose : high
        double newLow = newClose < low ? newClose : low

        return new MarketPrice(
                day: day,
                open: open,
                volume: volume,
                high: newHigh,
                low: newLow,
                close: newClose
        )
    }



    Map formatForJSON() {
        return [
                day   : day,
                high  : high,
                low   : low,
                open  : open,
                close : close,
                volume: volume
        ]
    }
}
