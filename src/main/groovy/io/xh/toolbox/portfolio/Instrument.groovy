package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class Instrument extends JSONFormatCached {
    String symbol
    String sector
    String region

    Map formatForJSON() {
        return [
                symbol: symbol,
                sector: sector,
                region: region
        ]
    }
}