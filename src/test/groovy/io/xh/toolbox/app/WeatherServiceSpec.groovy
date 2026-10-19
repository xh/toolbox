package io.xh.toolbox.app

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.exception.ExternalHttpException
import io.xh.hoist.exception.NotFoundException
import io.xh.hoist.exception.RoutineException
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.http.JSONClient
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

/**
 * Tests the configuration guard and the error mapping in {@link WeatherService}. The service creates
 * its caches in field initializers and reads soft config, which is what the Hoist test harness makes
 * possible here.
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

    def 'an unknown city is a routine 404, with no API key in the message'() {
        given:
        testConfigService.set('weatherApiKey', 'SECRET')
        service._jsonClient = failingClient(404)
        runSpansInline()

        when:
        service.getCurrentWeather('Atlantis')

        then:
        def e = thrown(NotFoundException)
        e.message == "No weather found for 'Atlantis'."
        e instanceof RoutineException

        when:
        service.getForecast('Atlantis')

        then:
        thrown(NotFoundException)
    }

    def 'other upstream failures are routine, with no API key in the message'() {
        given:
        testConfigService.set('weatherApiKey', 'SECRET')
        service._jsonClient = failingClient(500)
        runSpansInline()

        when:
        service.getCurrentWeather('London')

        then:
        def e = thrown(RoutineRuntimeException)
        !e.message.contains('SECRET')
    }

    def 'admin stats expose the key config'() {
        given:
        testConfigService.set('weatherApiKey', 'abc')

        expect:
        service.adminStats.config == [weatherApiKey: 'abc']
    }

    //------------------
    // Implementation
    //------------------
    /**
     * Run the service's spans as plain calls. The Hoist test harness has no TraceService, which
     * `span()` needs.
     */
    private void runSpansInline() {
        def run = new Expando(run: { Closure fn -> fn() })
        service.metaClass.span = { String name -> new Expando(logDebug: { msg -> run }) }
    }

    /** A client that fails as JSONClient does - with the full URL, key and all, in the message. */
    private JSONClient failingClient(int status) {
        Stub(JSONClient) {
            executeAsMap(_) >> {
                throw new ExternalHttpException(
                    'Failure calling https://api.openweathermap.org/data/2.5/weather?q=x&appid=SECRET : Error',
                    null,
                    status
                )
            }
        }
    }
}
