package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.http.JSONClient
import io.xh.toolbox.Forecast
import io.xh.toolbox.WeatherItemIntermediate
import org.apache.hc.client5.http.classic.methods.HttpGet

class WeatherService extends BaseService {

    private JSONClient _jsonClient


    Forecast getWeatherItems(String lat, String lng) {
        try {
            def url = "https://api.weather.gov/points/${lat},${lng}",
                coordinateMeta = client.executeAsMap(new HttpGet(url))

            def forecastRaw = client.executeAsMap(new HttpGet(coordinateMeta.properties.forecastHourly))

            return new Forecast(forecastRaw)
        }catch (err){
            return null;
        }
    }



    private JSONClient getClient() {
        if (!_jsonClient) {
            _jsonClient = new JSONClient()
        }
        return _jsonClient
    }

    void clearCaches() {
        super.clearCaches()
        _jsonClient = null
    }
}
