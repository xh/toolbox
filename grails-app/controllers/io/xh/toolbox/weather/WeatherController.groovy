package io.xh.toolbox.weather

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class WeatherController extends BaseController {

    def weatherService

    def current() {
        def city = params.city
        if (!city) throw new RuntimeException('Required parameter "city" not provided.')
        renderJSON(weatherService.getCurrentWeather(city))
    }

    def forecast() {
        def city = params.city
        if (!city) throw new RuntimeException('Required parameter "city" not provided.')
        renderJSON(weatherService.getForecast(city))
    }
}
