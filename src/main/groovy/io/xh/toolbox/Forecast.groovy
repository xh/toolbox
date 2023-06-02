package io.xh.toolbox

import io.xh.hoist.json.JSONFormatCached
import org.apache.hc.client5.http.classic.methods.HttpGet

import java.awt.image.*

class Forecast extends JSONFormatCached {

    final int temperature
    final String shortForecast
    String icon

    Forecast(Map mp) {
        temperature = mp.properties.periods[0].temperature
        shortForecast = mp.properties.periods[0].shortForecast
        icon = mp.properties.periods[0].icon
    }

    Map formatForJSON() {
        return [
                temperature: temperature,
                shortForecast: shortForecast,
                icon: icon
        ]
    }

}
