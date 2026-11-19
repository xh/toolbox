package io.xh.toolbox.weather

import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime

/**
 * Seeded weather for the weather Data Catalog's datasets, in the shape of OpenWeatherMap's data
 * as Weather V2 normalizes it. Any city name works. Values depend only on the city and the time,
 * so a time step reads the same on every request.
 */
class WeatherDatasets {

    static final long STEP_MS = 3 * 60 * 60 * 1000L
    static final int FORECAST_STEPS = 40
    private static final long DAY_MS = 24 * 60 * 60 * 1000L

    /** Zone that sets each step's `day` and whether it is day or night. */
    final ZoneId zone

    WeatherDatasets(ZoneId zone) {
        this.zone = zone
    }

    /** One row per three-hour step over the next five days, from the first step after now. */
    List<Map> forecast(String city, String units, Instant now) {
        long first = (now.toEpochMilli().intdiv(STEP_MS) + 1) * STEP_MS
        return (0..<FORECAST_STEPS).collect { int i ->
            long time = first + i * STEP_MS
            return [
                id  : "$city|$time".toString(),
                city: city,
                time: time,
                day : Instant.ofEpochMilli(time).atZone(zone).toLocalDate().toString(),
                *   : sample(city, time, units)
            ]
        }
    }

    /** The conditions now, as one row. */
    Map current(String city, String units, Instant now) {
        Map w = sample(city, now.toEpochMilli(), units)
        return [id: city, city: city] + w.subMap(
            ['temp', 'feelsLike', 'humidity', 'pressure', 'windSpeed', 'windGust', 'conditions', 'iconCode']
        )
    }

    //------------------------
    // Implementation
    //------------------------
    private Map sample(String city, long time, String units) {
        long seed = city.toLowerCase().hashCode()
        double days = time / (double) DAY_MS
        long slot = time.intdiv(STEP_MS)
        ZonedDateTime local = Instant.ofEpochMilli(time).atZone(zone)
        double hour = local.hour + local.minute / 60d

        double baseC = 2 + Math.floorMod(seed, 2600L) / 100d,
            front = smooth(seed, days / 2),
            wetness = smooth(seed + 1, days / 1.5),
            windiness = smooth(seed + 2, days),
            diurnal = -Math.cos(2 * Math.PI * (hour - 3) / 24),
            jitter = noise(seed + 3, slot)

        double tempC = baseC + 6 * front + 5 * diurnal + 0.8 * jitter,
            humidity = clamp(60 - 12 * diurnal + 25 * wetness + 3 * jitter, 20, 100),
            chance = clamp(0.4 + 0.6 * wetness + 0.1 * jitter, 0, 1),
            rainMm = chance > 0.6 ? ((chance - 0.6) * 12 * (0.5 + Math.abs(noise(seed + 4, slot)))).round(1) : 0,
            windMs = 1.5 + 4 * Math.abs(windiness) + Math.abs(noise(seed + 5, slot)),
            gustMs = windMs * (1.3 + 0.3 * Math.abs(noise(seed + 6, slot))),
            pressure = 1013 - 15 * wetness + 3 * jitter

        double feelsC = tempC
        if (tempC < 10 && windMs > 1.3) feelsC -= 0.7 * windMs
        if (tempC > 26 && humidity > 60) feelsC += (humidity - 60) / 10

        String conditions = rainMm > 0 ?
            (tempC < 0 ? 'Snow' : rainMm > 3 && tempC > 18 ? 'Thunderstorm' : rainMm < 0.5 ? 'Drizzle' : 'Rain') :
            (humidity > 92 ? 'Mist' : chance > 0.35 ? 'Clouds' : 'Clear')

        boolean imperial = units == 'imperial'
        Closure<Double> temp = { double c -> (imperial ? c * 9 / 5 + 32 : c).round(1) }
        Closure<Double> speed = { double ms -> (imperial ? ms * 2.23694 : ms).round(1) }

        return [
            temp             : temp(tempC),
            feelsLike        : temp(feelsC),
            tempMin          : temp(tempC - 1 - Math.abs(jitter)),
            tempMax          : temp(tempC + 1 + Math.abs(jitter)),
            humidity         : Math.round(humidity),
            pressure         : Math.round(pressure),
            windSpeed        : speed(windMs),
            windGust         : speed(gustMs),
            precipProbability: chance.round(2),
            precipVolume     : rainMm,
            conditions       : conditions,
            iconCode         : ICONS[conditions] + (hour >= 6 && hour < 18 ? 'd' : 'n')
        ]
    }

    private static final Map<String, String> ICONS = [
        Clear: '01', Clouds: '04', Drizzle: '09', Rain: '10', Thunderstorm: '11', Snow: '13', Mist: '50'
    ]

    private static double clamp(double v, double lo, double hi) {
        Math.max(lo, Math.min(hi, v))
    }

    // Smoothly interpolated noise in [-1, 1] over a continuous x.
    private static double smooth(long seed, double x) {
        long i = (long) Math.floor(x)
        double t = x - i
        t = t * t * (3 - 2 * t)
        return noise(seed, i) * (1 - t) + noise(seed, i + 1) * t
    }

    // Deterministic noise in [-1, 1] for an integer point (splitmix64).
    private static double noise(long seed, long k) {
        long z = seed * -7046029254386353131L + k * -4658895280553007687L
        z = (z ^ (z >>> 30)) * -4658895280553007687L
        z = (z ^ (z >>> 27)) * -7723592293110705685L
        z = z ^ (z >>> 31)
        return (z >>> 11) / (double) (1L << 53) * 2 - 1
    }
}
