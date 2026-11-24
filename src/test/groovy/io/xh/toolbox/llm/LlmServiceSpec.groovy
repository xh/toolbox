package io.xh.toolbox.llm

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.test.HoistUnitTest
import io.xh.hoist.test.fakes.TestUser
import spock.lang.Specification

import static io.xh.hoist.util.DateTimeUtils.appDay

/**
 * Tests the per-user limits and the request checks of {@link LlmService} - the policy that keeps
 * the relay from being an open proxy. Access is gated by the role on {@link LlmController}. Nothing
 * here calls the upstream API.
 */
class LlmServiceSpec extends Specification implements ServiceUnitTest<LlmService>, HoistUnitTest {

    TestUser member = new TestUser('member', ['TOOLBOX_LLM_USER']),
             unlimited = new TestUser('unlimited', ['TOOLBOX_LLM_USER', LlmService.UNLIMITED_ROLE])

    def setup() {
        useAppTimeZone('UTC')
        testConfigService.registerTypedConfig('llmConfig', LlmConfig)
        testConfigService.set('llmApiKey', 'test-key')
        setLlmConfig()
    }

    def 'a call counts toward the hourly limit the moment it is admitted'() {
        given:
        loginAs(member)

        when: 'two calls are admitted and finish, failed or not'
        2.times {
            service.reserveCall(member, [:])
            service.releaseCall(member.username)
        }

        and:
        service.reserveCall(member, [:])

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('limit of 2')
        testTrackService.lastTracked.msg == 'LLM rate limit hit'
        testTrackService.lastTracked.severity == 'WARN'
    }

    def 'unlimited users have no hourly limit, and a limit of 0 leaves only them'() {
        given:
        setLlmConfig(rateLimit: 0)

        when:
        5.times {
            service.reserveCall(unlimited, [:])
            service.releaseCall(unlimited.username)
        }

        then:
        noExceptionThrown()

        when:
        service.reserveCall(member, [:])

        then:
        thrown(RoutineRuntimeException)
    }

    def 'a user may run at most two streams at once'() {
        given:
        setLlmConfig(rateLimit: 10)
        2.times { service.reserveCall(unlimited, [:]) }

        when:
        service.reserveCall(unlimited, [:])

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('two replies running')

        when: 'one finishes'
        service.releaseCall(unlimited.username)
        service.reserveCall(unlimited, [:])

        then:
        noExceptionThrown()
    }

    def 'saving a config does not reset the limits'() {
        given:
        2.times {
            service.reserveCall(member, [:])
            service.releaseCall(member.username)
        }

        when:
        service.clearCaches()
        service.reserveCall(member, [:])

        then:
        thrown(RoutineRuntimeException)
    }

    def 'calls count in one replicated entry per user, so every instance sees them'() {
        given: 'two calls admitted on another instance'
        service._usage.put(member.username, [day: appDay().toString(), tokens: 0L, calls: [now(), now()]])

        when:
        service.reserveCall(member, [:])

        then:
        service._usage.replicate
        def e = thrown(RoutineRuntimeException)
        e.message.contains('limit of 2')
    }

    def 'a daily token limit refuses a user once today\'s tokens reach it, until the next day'() {
        given:
        setLlmConfig(rateLimit: 100, dailyTokenLimit: 100)
        service.addTokens(member.username, [input_tokens: 60, output_tokens: 30, cache_read_input_tokens: 6, cache_creation_input_tokens: 4])

        when:
        service.reserveCall(member, CONTEXT)

        then:
        def e = thrown(RoutineRuntimeException)
        e.message == "You have used today's 100 assistant tokens. Try again tomorrow."
        testTrackService.lastTracked.msg == 'LLM token limit hit'
        testTrackService.lastTracked.data == [limit: 100, tokens: 100, *: CONTEXT]

        when: 'unlimited users are exempt'
        service.addTokens(unlimited.username, [input_tokens: 500])
        service.reserveCall(unlimited, [:])

        then:
        noExceptionThrown()

        when: 'the count is per day'
        service._usage.put(member.username, service._usage.get(member.username) + [day: appDay().minusDays(1).toString()])
        service.reserveCall(member, [:])

        then:
        noExceptionThrown()
    }

    def 'the daily budget counts every user, and past it only unlimited users may call'() {
        given:
        setLlmConfig(rateLimit: 100, dailyTokenBudget: 150)
        service.addTokens('other', [input_tokens: 100])
        service.addTokens(unlimited.username, [output_tokens: 50])

        when:
        service.reserveCall(member, [:])

        then:
        def e = thrown(RoutineRuntimeException)
        e.message == 'The assistant demo has paused for today. Try again tomorrow.'
        testTrackService.lastTracked.msg == 'LLM token budget reached'

        when:
        service.reserveCall(unlimited, [:])

        then:
        noExceptionThrown()
    }

    def 'token limits are off by default'() {
        given:
        setLlmConfig(rateLimit: 100)
        service.addTokens(member.username, [input_tokens: 10_000_000])

        when:
        service.reserveCall(member, [:])

        then:
        noExceptionThrown()
        new LlmConfig([:]).with { [dailyTokenLimit, dailyTokenBudget, rateLimit] } == [null, null, 20]
    }

    def 'usage reports a user\'s calls and tokens, and what is left of each'() {
        given:
        setLlmConfig(rateLimit: 5, dailyTokenLimit: 1000, dailyTokenBudget: 2000)
        service.reserveCall(member, [:])
        service.releaseCall(member.username)
        service.addTokens(member.username, [input_tokens: 300, output_tokens: 100])

        expect:
        service.usage(member) == [
            unlimited: false, calls: 1, callsLeft: 4, tokens: 400, tokensLeft: 600, paused: false, canCall: true
        ]

        when:
        service.addTokens('other', [input_tokens: 1600])

        then:
        service.usage(member).subMap('paused', 'canCall') == [paused: true, canCall: false]
        service.usage(unlimited) == [
            unlimited: true, calls: 0, callsLeft: null, tokens: 0, tokensLeft: null, paused: false, canCall: true
        ]
    }

    def 'the context header keeps only app, feature and blueprintId, as short strings, and tracks the id as client-reported'() {
        expect:
        service.parseContext(header) == expected

        where:
        header                                                                        || expected
        '{"app": "weather", "feature": "architect", "blueprintId": "bp1", "x": 1}'    || [app: 'weather', feature: 'architect', clientBlueprintId: 'bp1']
        '{"app": 42, "feature": "answer"}'                                            || [feature: 'answer']
        "{\"app\": \"${'a' * 101}\"}"                                                  || [:]
        'not json'                                                                    || [:]
        null                                                                          || [:]
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
        service.stream([messages: [[role: 'user', content: 'Hi']]], unlimited, CONTEXT) { true }

        then:
        thrown(RoutineRuntimeException)
        testTrackService.lastTracked.msg == 'LLM call'
        testTrackService.lastTracked.severity == 'WARN'
        testTrackService.lastTracked.data.error == 'The model is busy.'
        testTrackService.lastTracked.data.subMap('app', 'feature', 'clientBlueprintId') == CONTEXT

        when: 'both of the user slots are free'
        2.times { service.reserveCall(unlimited, [:]) }

        then:
        noExceptionThrown()
    }

    def 'a refused request is tracked, and does not count toward the limit'() {
        given:
        loginAs(member)

        when:
        service.stream([messages: [], unexpected: true], member, [:]) { true }

        then:
        thrown(RoutineRuntimeException)
        testTrackService.lastTracked.msg == 'LLM request refused'

        when: 'the limit is untouched'
        2.times { service.reserveCall(member, [:]) }

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

    }

    def 'a client-sent server tool block is refused, as the client could forge its result'() {
        when:
        service.createBody(request([block]))

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains(block.type as String)

        where:
        block << [
            [type: 'server_tool_use', id: 's1', name: 'web_search', input: [:]],
            [type: 'web_search_tool_result', tool_use_id: 's1', content: []]
        ]
    }

    def 'configured server tools refuse every call, as they need a signed continuation'() {
        given:
        setLlmConfig(serverTools: [[type: 'web_search_20260209', name: 'web_search', max_uses: 3]])

        when:
        service.createBody(request([[type: 'text', text: 'Hi']]))

        then:
        def e = thrown(IllegalStateException)
        e.message.contains('signed continuation')
    }

    def 'calls use Sonnet 5.5 unless the config names a model'() {
        when:
        testConfigService.set('llmConfig', [maxTokens: 1000])

        then:
        service.createBody(request([[type: 'text', text: 'Hi']])).model == 'claude-sonnet-5-5'

        when:
        setLlmConfig(model: 'claude-opus-5-5')

        then:
        service.createBody(request([[type: 'text', text: 'Hi']])).model == 'claude-opus-5-5'
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
    static final Map CONTEXT = [app: 'weather', feature: 'architect', clientBlueprintId: 'bp1']

    private static long now() { System.currentTimeMillis() }

    private void setLlmConfig(Map overrides = [:]) {
        testConfigService.set('llmConfig', [model: 'test-model', maxTokens: 1000, rateLimit: 2] + overrides)
    }

    private Map request(List<Map> content) {
        [messages: [[role: 'user', content: 'Hi'], [role: 'assistant', content: content]]]
    }
}
