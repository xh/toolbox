package io.xh.toolbox.app

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

/**
 * Tests the configuration guard in {@link WeatherService}. The service creates its caches in field
 * initializers and reads soft config, which is what the Hoist test harness makes possible here.
 */
class WeatherServiceSpec extends Specification implements ServiceUnitTest<WeatherService>, HoistUnitTest {

    def 'an unconfigured API key is reported as a routine data-not-available error before any request'() {
        given:
        testConfigService.set('weatherApiKey', 'UNCONFIGURED')

        when:
        service.getCurrentWeather('London')

        then:
        def e = thrown(DataNotAvailableException)
        e.message.contains('weatherApiKey')

        when:
        service.getForecast('London')

        then:
        thrown(DataNotAvailableException)
    }

    def 'a missing API key config is an error'() {
        when:
        service.getCurrentWeather('London')

        then:
        def e = thrown(RuntimeException)
        e.message.contains('weatherApiKey')
    }

    def 'admin stats expose the key config'() {
        given:
        testConfigService.set('weatherApiKey', 'abc')

        expect:
        service.adminStats.config == [weatherApiKey: 'abc']
    }
}
