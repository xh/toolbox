package io.xh.toolbox.weather

import io.xh.hoist.json.JSONParser
import spock.lang.Specification

import java.time.ZoneId

class OpenWeatherRowsSpec extends Specification {

    // Trimmed from real /forecast and /weather responses, units=metric.
    static final Map FORECAST = JSONParser.parseObject('''{
        "cod": "200", "cnt": 2,
        "list": [
            {
                "dt": 1795057200,
                "main": {"temp": 7.42, "feels_like": 4.98, "temp_min": 6.9, "temp_max": 7.42, "pressure": 1009, "humidity": 87},
                "weather": [{"id": 500, "main": "Rain", "description": "light rain", "icon": "10n"}],
                "wind": {"speed": 3.6, "deg": 220, "gust": 8.1},
                "pop": 0.62,
                "rain": {"3h": 0.87},
                "dt_txt": "2026-11-19 03:00:00"
            },
            {
                "dt": 1795068000,
                "main": {"temp": 6.1, "feels_like": 6.1, "temp_min": 6.1, "temp_max": 6.1, "pressure": 1011, "humidity": 80},
                "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01n"}],
                "wind": {"speed": 1.2, "deg": 180},
                "pop": 0,
                "dt_txt": "2026-11-19 06:00:00"
            }
        ],
        "city": {"name": "London", "country": "GB"}
    }''')

    static final Map CURRENT = JSONParser.parseObject('''{
        "weather": [{"id": 803, "main": "Clouds", "description": "broken clouds", "icon": "04d"}],
        "main": {"temp": 9.3, "feels_like": 7.1, "temp_min": 8.2, "temp_max": 10.4, "pressure": 1012, "humidity": 76},
        "wind": {"speed": 4.12, "deg": 250},
        "dt": 1795050000,
        "name": "London"
    }''')

    def 'forecast steps map onto weather rows, with chance of rain as a fraction'() {
        when:
        def rows = OpenWeatherRows.forecast('London', FORECAST, ZoneId.of('UTC'))

        then:
        rows.size() == 2
        rows[0] == [
            id               : 'London|1795057200000',
            city             : 'London',
            time             : 1795057200000,
            day              : '2026-11-19',
            temp             : 7.42,
            feelsLike        : 4.98,
            tempMin          : 6.9,
            tempMax          : 7.42,
            humidity         : 87,
            pressure         : 1009,
            windSpeed        : 3.6,
            windGust         : 8.1,
            precipProbability: 0.62,
            precipVolume     : 0.87,
            conditions       : 'Rain',
            iconCode         : '10n'
        ]
        rows[1].precipVolume == 0
        rows[1].precipProbability == 0
        rows[1].windGust == null
        rows[1].conditions == 'Clear'
    }

    def 'day follows the zone'() {
        expect: '03:00 UTC is the evening before in New York'
        OpenWeatherRows.forecast('London', FORECAST, ZoneId.of('America/New_York'))[0].day == '2026-11-18'
    }

    def 'the current response maps onto one row with the requested city as id'() {
        expect:
        OpenWeatherRows.current('london', CURRENT) == [
            id        : 'london',
            city      : 'london',
            temp      : 9.3,
            feelsLike : 7.1,
            humidity  : 76,
            pressure  : 1012,
            windSpeed : 4.12,
            windGust  : null,
            conditions: 'Clouds',
            iconCode  : '04d'
        ]
    }
}
