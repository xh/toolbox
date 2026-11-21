package io.xh.toolbox.blueprints

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.jsonblob.JsonBlob
import io.xh.hoist.jsonblob.JsonBlobService
import io.xh.hoist.test.HoistUnitTest
import io.xh.hoist.test.fakes.TestUser
import io.xh.toolbox.llm.LlmConfig
import spock.lang.Specification

import java.time.LocalDate

import static io.xh.hoist.util.DateTimeUtils.appDay

class BlueprintFeatureRequestServiceSpec extends Specification implements ServiceUnitTest<BlueprintFeatureRequestService>, DataTest, HoistUnitTest {

    TestUser ann = new TestUser('ann'), bob = new TestUser('bob')

    static final Map REQUEST = [
        summary   : 'A gauge that shows a target band',
        category  : 'widget',
        userWords : 'can the gauge show our risk limit band in amber?',
        workaround: 'Added a callout under the gauge with the limit.',
        fragment  : [component: 'gauge', config: [source: 'risk', field: 'var95']],
        context   : [app: 'spoofed', appVersion: '1.0', user: 'mallory', submitted: 1]
    ]

    Class[] getDomainClassesToMock() { [JsonBlob] }

    def setup() {
        useAppTimeZone('UTC')
        testConfigService.registerTypedConfig('llmConfig', LlmConfig)
        testConfigService.set('llmConfig', [dailyFeatureRequests: 2])
        service.jsonBlobService = defineService(JsonBlobService)
        loginAs(ann)
    }

    private Map body(Map request = REQUEST) {
        [request: request, blueprintType: 'toolbox.portfolio', blueprintId: 'one-grid', app: 'app']
    }

    def 'a request is stored whole for the session user, and tracked by reference'() {
        when:
        String id = service.submit(body()).id

        then:
        def rows = service.list(appDay(), appDay())
        rows.size() == 1
        rows[0] == [
            id           : id,
            submitted    : rows[0].submitted,
            user         : 'ann',
            app          : 'app',
            blueprintType: 'toolbox.portfolio',
            blueprintId  : 'one-grid',
            category     : 'widget',
            summary      : 'A gauge that shows a target band',
            userWords    : 'can the gauge show our risk limit band in amber?',
            workaround   : 'Added a callout under the gauge with the limit.',
            fragment     : [component: 'gauge', config: [source: 'risk', field: 'var95']]
        ]
        rows[0].submitted instanceof Long
        testTrackService.lastTracked.category == 'Blueprint Feature Request'
        testTrackService.lastTracked.data == [
            id: id, category: 'widget', summary: 'A gauge that shows a target band',
            app: 'app', blueprintType: 'toolbox.portfolio', blueprintId: 'one-grid'
        ]
    }

    def 'a request breaking a rule is refused with what to fix: #problem'() {
        when:
        service.submit(body(REQUEST + change))

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains(message)
        JsonBlob.count() == 0

        where:
        problem              | change                                         || message
        'blank summary'      | [summary: ' ']                                 || 'summary is one line of at most 120 characters'
        'long summary'       | [summary: 'x' * 121]                           || 'summary is one line'
        'unknown category'   | [category: 'theme']                            || 'category is one of widget, renderer'
        'missing userWords'  | [userWords: null]                              || 'userWords is the user'
        'long userWords'     | [userWords: 'x' * 1001]                        || 'at most 1000 characters'
        'long workaround'    | [workaround: 'x' * 501]                        || 'workaround is at most 500'
        'fragment not a map' | [fragment: ['a']]                              || 'fragment is one element or config object'
        'large fragment'     | [fragment: [text: 'x' * 5000]]                 || 'at most 5000 characters of JSON'
        'inline rows'        | [fragment: [source: [inline: [rows: [[a: 1]]]]]] || "fragment holds 'inline'"
        'nested rows'        | [fragment: [config: [a: [[rows: []]]]]]       || "fragment holds 'rows'"
        'artifact reference' | [fragment: [artifact: 'a1']]                   || "fragment holds 'artifact'"
        'extra field'        | [priority: 'high']                             || "'priority' is not a field of a request"
    }

    def 'the context fields are checked too'() {
        when:
        service.submit(body() + change)

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains(message)

        where:
        change                         || message
        [blueprintType: 'x' * 51]      || 'blueprintType'
        [blueprintId: 'has space']     || 'blueprintId'
        [app: null]                    || 'app'
        [request: 'not a request']     || 'Send a request object'
    }

    def 'each user may send llmConfig.dailyFeatureRequests a day'() {
        given:
        2.times { service.submit(body()) }

        when:
        service.submit(body())

        then:
        def e = thrown(RoutineRuntimeException)
        e.message == 'You have sent the 2 feature requests allowed today. Try again tomorrow.'
        testTrackService.lastTracked.msg == 'Blueprint feature request limit hit'

        when: 'another user has their own count'
        loginAs(bob)
        service.submit(body())

        then:
        JsonBlob.count() == 3
    }

    def 'requests list by app day, newest first, across users'() {
        given:
        String first = service.submit(body()).id
        loginAs(bob)
        String second = service.submit(body(REQUEST + [summary: 'Second'])).id
        JsonBlob.findByToken(first).with {
            dateCreated = Date.from(LocalDate.of(2026, 1, 1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant())
            save(flush: true)
        }

        expect:
        service.list(appDay(), appDay())*.id == [second]
        service.list(LocalDate.of(2026, 1, 1), appDay())*.id == [second, first]
        service.list(LocalDate.of(2026, 1, 2), appDay().minusDays(1)) == []

        when:
        service.list(appDay(), appDay().minusDays(1))

        then:
        thrown(RoutineRuntimeException)
    }
}
