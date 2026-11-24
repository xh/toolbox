package io.xh.toolbox.app

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.exception.ExternalHttpException
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.http.JSONClient
import io.xh.hoist.test.HoistUnitTest
import org.apache.hc.client5.http.classic.methods.HttpUriRequestBase
import spock.lang.Specification

/**
 * Tests the configuration guard in {@link WeatherService}, and that OpenWeatherMap failures never
 * reach the client with the API key. The service creates its caches in field initializers and
 * reads soft config, which is what the Hoist test harness makes possible here.
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

    def 'an OpenWeatherMap failure is reported without its request URL, which holds the API key'() {
        given:
        testConfigService.set('weatherApiKey', 'SECRET-KEY')
        service._jsonClient = new FailingClient(status)

        when:
        service."$method"('Nowhere')

        then:
        def e = thrown(expected)
        e.message == message
        !e.message.contains('SECRET-KEY')

        where:
        method              | status || expected                  | message
        'getCurrentWeather' | 404    || RoutineRuntimeException   | "Unknown city 'Nowhere'"
        'getForecast'       | 400    || RoutineRuntimeException   | "Unknown city 'Nowhere'"
        'getCurrentWeather' | 401    || DataNotAvailableException | 'Weather data is unavailable (OpenWeatherMap status: 401)'
        'getForecast'       | null   || DataNotAvailableException | 'Weather data is unavailable (no response from OpenWeatherMap)'
    }

    // Fails as JSONClient does, with the request URL in its message.
    static class FailingClient extends JSONClient {
        final Integer status

        FailingClient(Integer status) { this.status = status }

        @Override
        Map executeAsMap(HttpUriRequestBase method, Long timeoutMs) {
            throw new ExternalHttpException("Failure calling ${method.uri} : $status", null, status)
        }
    }

    def 'admin stats expose the key config'() {
        given:
        testConfigService.set('weatherApiKey', 'abc')

        expect:
        service.adminStats.config == [weatherApiKey: 'abc']
    }
}
