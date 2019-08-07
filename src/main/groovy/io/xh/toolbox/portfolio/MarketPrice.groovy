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


    MarketPrice perturb(Float pctRange) {
        double newClose = close * (1+(randDouble(-pctRange, pctRange)/100))
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
