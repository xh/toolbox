package io.xh.toolbox.weather

import spock.lang.Specification

import java.time.Instant
import java.time.ZoneId

class WeatherDatasetsSpec extends Specification {

    static final Instant NOW = Instant.parse('2026-01-05T04:20:00Z')
    static final List<String> CONDITIONS = ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist']

    WeatherDatasets utc = new WeatherDatasets(ZoneId.of('UTC'))

    def 'the forecast is forty three-hour steps from the first step after now'() {
        when:
        def rows = utc.forecast('London', 'metric', NOW)

        then:
        rows.size() == 40
        rows[0].time == Instant.parse('2026-01-05T06:00:00Z').toEpochMilli()
        rows.collate(2, 1, false).every { a, b -> b.time - a.time == WeatherDatasets.STEP_MS }
        rows[0].id == "London|${rows[0].time}"
        rows[0].city == 'London'
        rows[0].day == '2026-01-05'
        rows.last().day == '2026-01-10'
    }

    def 'values are plausible and consistent with each other'() {
        when:
        def rows = ['London', 'Tokyo', 'Cairo', 'Oslo', 'Lima'].collectMany { utc.forecast(it, 'metric', NOW) }

        then:
        rows.every { it.conditions in CONDITIONS }
        rows.every { it.iconCode ==~ /\d\d[dn]/ }
        rows.every { it.tempMin <= it.temp && it.temp <= it.tempMax }
        rows.every { it.humidity >= 20 && it.humidity <= 100 }
        rows.every { it.precipProbability >= 0 && it.precipProbability <= 1 }
        rows.every { (it.precipVolume > 0) == (it.conditions in ['Rain', 'Drizzle', 'Thunderstorm', 'Snow']) }
        rows.every { it.windGust >= it.windSpeed }
        rows.every { it.pressure > 950 && it.pressure < 1050 }
        rows*.conditions.toSet().size() > 2
    }

    def 'a step reads the same on every request, and cities differ'() {
        expect:
        utc.forecast('London', 'metric', NOW) == utc.forecast('London', 'metric', NOW.plusSeconds(3600))
        utc.forecast('London', 'metric', NOW) == utc.forecast('london', 'metric', NOW)*.collectEntries { k, v ->
            [k, k == 'city' ? 'London' : k == 'id' ? v.replace('london', 'London') : v]
        }
        utc.forecast('London', 'metric', NOW)*.temp != utc.forecast('Cairo', 'metric', NOW)*.temp
    }

    def 'imperial units give Fahrenheit and miles per hour'() {
        given:
        def metric = utc.forecast('Paris', 'metric', NOW)[3]
        def imperial = utc.forecast('Paris', 'imperial', NOW)[3]

        expect:
        Math.abs(imperial.temp - (metric.temp * 9 / 5 + 32)) < 0.2
        Math.abs(imperial.windSpeed - metric.windSpeed * 2.23694) < 0.3
        imperial.humidity == metric.humidity
    }

    def 'day and night follow the zone'() {
        given:
        def ny = new WeatherDatasets(ZoneId.of('America/New_York'))
        def step = ny.forecast('Chicago', 'metric', Instant.parse('2026-01-05T02:00:00Z'))[0]

        expect: '03:00 UTC is 22:00 the day before in New York'
        step.day == '2026-01-04'
        step.iconCode.endsWith('n')
    }

    def 'current conditions are one row of the current fields'() {
        when:
        def row = utc.current('Sydney', 'imperial', NOW)

        then:
        row.keySet() == ['id', 'city', 'temp', 'feelsLike', 'humidity', 'pressure', 'windSpeed', 'windGust', 'conditions', 'iconCode', 'tempNext24h'] as Set
        row.id == 'Sydney'
        row.tempNext24h == utc.forecast('Sydney', 'imperial', NOW).take(8)*.temp
        row == utc.current('Sydney', 'imperial', NOW)
    }
}
