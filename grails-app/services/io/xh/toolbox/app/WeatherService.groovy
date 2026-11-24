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

    ConfigService configService

    private Cache<String, Map> _currentWeatherCache = createCache(
        name: 'currentWeather', expireTime: 10 * MINUTES
    )
    private Cache<String, Map> _forecastCache = createCache(
        name: 'forecast', expireTime: 30 * MINUTES
    )

    Map getCurrentWeather(String city) {
        _currentWeatherCache.getOrCreate(city) { loadCurrentWeather(city) }
    }

    Map getForecast(String city) {
        _forecastCache.getOrCreate(city) { loadForecast(city) }
    }

    //------------------------
    // Implementation
    //------------------------
    private Map loadCurrentWeather(String city) {
        def apiKey = getApiKey(),
            encodedCity = URLEncoder.encode(city, 'UTF-8'),
            url = "https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=imperial"

        span('getCurrent')
            .logDebug("Loading forecast for $city")
            .run {
                fetch(city, url)
            }
      }

    private Map loadForecast(String city) {
        def apiKey = getApiKey(),
            encodedCity = URLEncoder.encode(city, 'UTF-8'),
            url = "https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&units=imperial"

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
            Integer status = e.statusCode
            if (status in [400, 404]) throw new RoutineRuntimeException("Unknown city '$city'")

            // Without a status, the cause is a transport error that can also hold the URL.
            String cause = status ? e.cause?.message : null
            logWarn('OpenWeatherMap request failed', [city: city, status: status ?: 'no response', cause: cause].findAll { it.value != null })
            String detail = status ? "OpenWeatherMap status: $status" : 'no response from OpenWeatherMap'
            throw new DataNotAvailableException("Weather data is unavailable ($detail)")
        }
    }

    private String getApiKey() {
        def key = configService.getString('weatherApiKey')
        if (key == 'UNCONFIGURED') {
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
