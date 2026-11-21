package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.config.ConfigService
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.exception.ExternalHttpException
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.http.JSONClient
import org.apache.hc.client5.http.classic.methods.HttpGet

import static io.xh.hoist.util.DateTimeUtils.MINUTES

class WeatherService extends BaseService {

    String telemetryPrefix = 'toolbox.weather'

    static clearCachesConfigs = ['weatherApiKey']

    private static final String UNCONFIGURED = 'UNCONFIGURED'

    ConfigService configService

    private Cache<String, Map> _currentWeatherCache = createCache(
        name: 'currentWeather', expireTime: 10 * MINUTES
    )
    private Cache<String, Map> _forecastCache = createCache(
        name: 'forecast', expireTime: 30 * MINUTES
    )

    /** @param units - OpenWeatherMap's 'imperial' or 'metric'. */
    Map getCurrentWeather(String city, String units = 'imperial') {
        _currentWeatherCache.getOrCreate("$city|$units".toString()) { loadCurrentWeather(city, units) }
    }

    /** @param units - OpenWeatherMap's 'imperial' or 'metric'. */
    Map getForecast(String city, String units = 'imperial') {
        _forecastCache.getOrCreate("$city|$units".toString()) { loadForecast(city, units) }
    }

    /** True if an OpenWeatherMap API key is configured. */
    boolean isConfigured() {
        configService.getString('weatherApiKey', UNCONFIGURED) != UNCONFIGURED
    }

    //------------------------
    // Implementation
    //------------------------
    private Map loadCurrentWeather(String city, String units) {
        def apiKey = getApiKey(),
            encodedCity = URLEncoder.encode(city, 'UTF-8'),
            url = "https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=${units}"

        span('getCurrent')
            .logDebug("Loading forecast for $city")
            .run {
                fetch(city, url)
            }
      }

    private Map loadForecast(String city, String units) {
        def apiKey = getApiKey(),
            encodedCity = URLEncoder.encode(city, 'UTF-8'),
            url = "https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&units=${units}"

        span('getForecast')
            .logDebug("Loading forecast for $city")
            .run {
                fetch(city, url)
            }
    }

    private Map fetch(String city, String url) {
        try {
            return client.executeAsMap(new HttpGet(url))
        } catch (ExternalHttpException e) {
            // Its message holds the request URL, and with it the API key.
            if (e.statusCode in [400, 404]) throw new RoutineRuntimeException("Unknown city '$city'")
            String status = e.statusCode ?: 'no response'
            logWarn('OpenWeatherMap request failed', [city: city, status: status])
            throw new DataNotAvailableException("Weather data is unavailable: OpenWeatherMap returned $status")
        }
    }

    private String getApiKey() {
        def key = configService.getString('weatherApiKey')
        if (key == UNCONFIGURED) {
            throw new DataNotAvailableException(
                'Weather API key not configured. Set the "weatherApiKey" config in the Admin console ' +
                'with a valid OpenWeatherMap API key (https://openweathermap.org/api).'
            )
        }
        return key
    }

    private JSONClient _jsonClient
    private JSONClient getClient() {
        _jsonClient ?= new JSONClient()
    }

    void clearCaches() {
        _jsonClient = null
        _currentWeatherCache.clear()
        _forecastCache.clear()
        super.clearCaches()
    }

    Map getAdminStats() {[
        config: configForAdminStats('weatherApiKey')
    ]}
}
