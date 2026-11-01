package io.xh.toolbox.llm

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.NotAuthorizedException
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.test.HoistUnitTest
import io.xh.hoist.test.fakes.TestUser
import spock.lang.Specification

/**
 * Tests the access rule, the per-user limits and the request checks of {@link LlmService} - the
 * policy that keeps the relay from being an open proxy. Nothing here calls the upstream API.
 */
class LlmServiceSpec extends Specification implements ServiceUnitTest<LlmService>, HoistUnitTest {

    TestUser member = new TestUser('member', [LlmService.USER_ROLE]),
             unlimited = new TestUser('unlimited', [LlmService.USER_ROLE, LlmService.UNLIMITED_ROLE]),
             outsider = new TestUser('outsider')

    def setup() {
        testConfigService.setAll(
            llmOpenToAllUsers: false,
            llmRateLimit: 2,
            llmMaxStreams: 20,
            llmApiKey: 'test-key',
            llmModel: 'test-model',
            llmMaxTokens: 1000,
            llmRequestParams: [:],
            llmServerTools: []
        )
    }

    def 'a user needs the role, unless the feature is open to all users'() {
        expect:
        service.canUse(member)
        !service.canUse(outsider)

        when:
        loginAs(outsider)
        service.checkAccess(outsider)

        then:
        thrown(NotAuthorizedException)
        testTrackService.lastTracked.msg == 'LLM access denied'
        testTrackService.lastTracked.severity == 'WARN'

        when:
        testConfigService.set('llmOpenToAllUsers', true)

        then:
        service.canUse(outsider)
    }

    def 'a call counts toward the hourly limit the moment it is admitted'() {
        given:
        loginAs(member)

        when: 'two calls are admitted and finish, failed or not'
        2.times {
            service.reserveCall(member)
            service.releaseCall(member.username)
        }

        and:
        service.reserveCall(member)

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('limit of 2')
        testTrackService.lastTracked.msg == 'LLM rate limit hit'
        testTrackService.lastTracked.severity == 'WARN'
    }

    def 'unlimited users have no hourly limit, and a limit of 0 leaves only them'() {
        given:
        testConfigService.set('llmRateLimit', 0)

        when:
        5.times {
            service.reserveCall(unlimited)
            service.releaseCall(unlimited.username)
        }

        then:
        noExceptionThrown()

        when:
        service.reserveCall(member)

        then:
        thrown(RoutineRuntimeException)
    }

    def 'a user may run at most two streams at once'() {
        given:
        testConfigService.set('llmRateLimit', 10)
        2.times { service.reserveCall(unlimited) }

        when:
        service.reserveCall(unlimited)

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('two replies running')

        when: 'one finishes'
        service.releaseCall(unlimited.username)
        service.reserveCall(unlimited)

        then:
        noExceptionThrown()
    }

    def 'saving a config does not reset the limits'() {
        given:
        2.times {
            service.reserveCall(member)
            service.releaseCall(member.username)
        }

        when:
        service.clearCaches()
        service.reserveCall(member)

        then:
        thrown(RoutineRuntimeException)
    }

    def 'an oversized body is rejected before it is parsed'() {
        when:
        service.checkRequestSize(2_000_000)

        then:
        thrown(RoutineRuntimeException)
        testTrackService.lastTracked.msg == 'LLM request too large'

        when: 'a body of unknown length, such as a chunked one'
        service.checkRequestSize(-1)

        then:
        thrown(RoutineRuntimeException)

        when:
        service.checkRequestSize(50_000)

        then:
        noExceptionThrown()
    }

    def 'a call that fails upstream releases its stream slot, and is tracked at WARN'() {
        given:
        loginAs(unlimited)
        // The upstream call fails inside the span. The Hoist test harness has no TraceService.
        service.metaClass.span = { String name, Map tags ->
            new Expando(logDebug: { msg ->
                new Expando(run: { Closure fn -> throw new RoutineRuntimeException('The model is busy.') })
            })
        }

        when:
        service.stream([messages: [[role: 'user', content: 'Hi']]], unlimited) { true }

        then:
        thrown(RoutineRuntimeException)
        testTrackService.lastTracked.msg == 'LLM call'
        testTrackService.lastTracked.severity == 'WARN'
        testTrackService.lastTracked.data.error == 'The model is busy.'

        when: 'both of the user slots are free'
        2.times { service.reserveCall(unlimited) }

        then:
        noExceptionThrown()
    }

    def 'a refused request is tracked, and does not count toward the limit'() {
        given:
        loginAs(member)

        when:
        service.stream([messages: [], unexpected: true], member) { true }

        then:
        thrown(RoutineRuntimeException)
        testTrackService.lastTracked.msg == 'LLM request refused'

        when: 'the limit is untouched'
        2.times { service.reserveCall(member) }

        then:
        noExceptionThrown()
    }

    def 'messages may hold only text, tool and thinking blocks'() {
        expect:
        service.createBody(request([[type: 'text', text: 'Hi']]))
        service.createBody(request([
            [type: 'thinking', thinking: '...', signature: 'abc'],
            [type: 'tool_use', id: 't1', name: 'get_weather', input: [:]]
        ]))

        when:
        service.createBody(request([[type: 'image', source: [:]]]))

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('image')

        when:
        service.createBody(request([[type: 'server_tool_use', id: 's1', name: 'web_search']]))

        then: 'server tool blocks only while server tools are configured'
        thrown(RoutineRuntimeException)
    }

    def 'a conversation of more than 200 messages is too long'() {
        when:
        service.createBody([messages: (1..201).collect { [role: 'user', content: 'Hi'] }])

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('too long')
    }

    //------------------
    // Implementation
    //------------------
    private Map request(List<Map> content) {
        [messages: [[role: 'user', content: 'Hi'], [role: 'assistant', content: content]]]
    }
}
