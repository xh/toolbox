package io.xh.toolbox.weather

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class WeatherController extends BaseController {

    def weatherService

    def index(String lat, String lng) {
        def items = weatherService.getWeatherItems(lat, lng)
        renderJSON(items)
    }

}
