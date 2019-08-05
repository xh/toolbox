package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

import java.time.LocalDate

class MarketPrice extends JSONFormatCached {
    LocalDate day
    double high
    double low
    double open
    double close
    long volume

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
