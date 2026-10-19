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
        load('getCurrent', 'weather', city)
    }

    private Map loadForecast(String city) {
        load('getForecast', 'forecast', city)
    }

    /**
     * Call an OpenWeatherMap endpoint for a city. Its URL carries the API key, so a failure never
     * passes the client's exception on - its message holds the URL. An unknown city is a routine 404.
     */
    private Map load(String spanName, String endpoint, String city) {
        def apiKey = getApiKey(),
            encodedCity = URLEncoder.encode(city, 'UTF-8'),
            url = "https://api.openweathermap.org/data/2.5/${endpoint}?q=${encodedCity}&appid=${apiKey}&units=imperial"

        span(spanName)
            .logDebug("Loading $endpoint for $city")
            .run {
                try {
                    client.executeAsMap(new HttpGet(url))
                } catch (ExternalHttpException e) {
                    throw toWeatherException(city, e.statusCode)
                }
            }
    }

    private Exception toWeatherException(String city, Integer status) {
        if (status == 404) return new CityNotFoundException(city)
        logWarn('OpenWeatherMap call failed', [city: city, status: status])
        return new RoutineRuntimeException('The weather service is not available right now. Try again later.')
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
