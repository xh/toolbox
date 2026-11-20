package io.xh.toolbox.weather

import java.time.Instant
import java.time.ZoneId

/**
 * Maps OpenWeatherMap's forecast and current weather responses onto the rows of the weather
 * datasets, as {@link WeatherDatasets} produces them. Values keep the units of the request.
 */
class OpenWeatherRows {

    /** One row per three-hour step of a `/forecast` response. */
    static List<Map> forecast(String city, Map response, ZoneId zone) {
        (response.list as List<Map>).collect { Map item ->
            long time = (item.dt as long) * 1000
            Map main = item.main as Map
            return [
                id               : "$city|$time".toString(),
                city             : city,
                time             : time,
                day              : Instant.ofEpochMilli(time).atZone(zone).toLocalDate().toString(),
                temp             : main.temp,
                feelsLike        : main.feels_like,
                tempMin          : main.temp_min,
                tempMax          : main.temp_max,
                humidity         : main.humidity,
                pressure         : main.pressure,
                windSpeed        : item.wind?.speed,
                windGust         : item.wind?.gust,
                precipProbability: item.pop,
                precipVolume     : item.rain?.'3h' ?: 0,
                *                : condition(item)
            ]
        }
    }

    /** The one row of a `/weather` response. */
    static Map current(String city, Map response) {
        Map main = response.main as Map
        return [
            id       : city,
            city     : city,
            temp     : main.temp,
            feelsLike: main.feels_like,
            humidity : main.humidity,
            pressure : main.pressure,
            windSpeed: response.wind?.speed,
            windGust : response.wind?.gust,
            *        : condition(response)
        ]
    }

    /** The temperatures of the first eight three-hour steps of a `/forecast` response. */
    static List tempNext24h(Map forecast) {
        (forecast.list as List<Map>).take(WeatherDatasets.SERIES_STEPS).collect { (it.main as Map).temp }
    }

    private static Map condition(Map item) {
        Map w = (item.weather as List<Map>)?.getAt(0)
        return [conditions: w?.main ?: 'Unknown', iconCode: w?.icon ?: '01d']
    }
}
