package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.config.ConfigService
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.http.JSONClient
import org.apache.hc.client5.http.classic.methods.HttpGet

import static io.xh.hoist.util.DateTimeUtils.MINUTES

class WeatherService extends BaseService {

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
            url = "https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=imperial",
            response = client.executeAsMap(new HttpGet(url))

        logDebug("Loaded current weather for ${city}.")
        return response
    }

    private Map loadForecast(String city) {
        def apiKey = getApiKey(),
            encodedCity = URLEncoder.encode(city, 'UTF-8'),
            url = "https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${apiKey}&units=imperial",
            response = client.executeAsMap(new HttpGet(url))

        logDebug("Loaded forecast for ${city}.")
        return response
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
