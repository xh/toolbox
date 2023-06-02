package io.xh.toolbox

import io.xh.hoist.json.JSONFormatCached

class WeatherItemIntermediate extends JSONFormatCached {

    final String id
    final String URL

    WeatherItemIntermediate(Map mp) {
        id = mp.id
        URL = mp.properties.forecast
    }

    Map formatForJSON() {
        return [
                id: id,
                URL: URL
        ]
    }

}
