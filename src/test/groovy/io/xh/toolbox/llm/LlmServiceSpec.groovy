package io.xh.toolbox.llm

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.test.HoistUnitTest
import io.xh.hoist.test.fakes.TestUser
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse
import org.apache.hc.core5.http.ClassicHttpRequest
import org.apache.hc.core5.http.HttpHost
import org.apache.hc.core5.http.io.entity.StringEntity
import org.apache.hc.core5.http.message.BasicClassicHttpResponse
import org.apache.hc.core5.http.protocol.HttpContext
import org.apache.hc.core5.io.CloseMode
import spock.lang.Specification

import static java.nio.charset.StandardCharsets.UTF_8

/**
 * Tests the per-user limits, the request checks and the tracking of {@link LlmService} - the
 * policy that keeps the relay from being an open proxy. Access is gated by the role on
 * {@link LlmController}. Nothing here calls the upstream API.
 */
class LlmServiceSpec extends Specification implements ServiceUnitTest<LlmService>, HoistUnitTest {

    TestUser member = new TestUser('member', ['ACCESS_LLM_FEATURES']),
             unlimited = new TestUser('unlimited', ['ACCESS_LLM_FEATURES', LlmService.UNLIMITED_ROLE])

    def setup() {
        testConfigService.registerTypedConfig('llmConfig', LlmConfig)
        testConfigService.set('llmApiKey', 'test-key')
        setLlmConfig()
        service.init()
    }

    def 'a call counts toward the hourly limit the moment it is admitted'() {
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
    }

    def 'unlimited users have no hourly limit, and a limit of 0 leaves only them'() {
        given:
        setLlmConfig(rateLimit: 0)

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

    def 'a user may run only maxStreamsPerUser streams at once'() {
        given:
        2.times { service.reserveCall(unlimited) }

        when:
        service.reserveCall(unlimited)

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('at once')

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

    def 'a body larger than maxRequestKb is rejected before it is parsed'() {
        when:
        service.checkRequestSize(500_000)

        then:
        thrown(RoutineRuntimeException)

        when: 'a body of unknown length, such as a chunked one'
        service.checkRequestSize(-1)

        then:
        thrown(RoutineRuntimeException)

        when:
        service.checkRequestSize(50_000)

        then:
        noExceptionThrown()
    }

    def 'a completed call is tracked once, with its token counts'() {
        given:
        loginAs(member)
        def events = []
        service.streamClient = fakeClient {
            sse([type: 'message_start', message: [usage: [input_tokens: 12, output_tokens: 1]]]) +
                sse([type: 'content_block_delta', delta: [type: 'text_delta', text: 'Hello']]) +
                sse([type: 'message_delta', usage: [output_tokens: 34]])
        }

        when:
        service.stream([messages: [[role: 'user', content: 'Hi']]], member) { events << it; true }

        then:
        events.size() == 3
        events[1].contains('Hello')
        with(testTrackService.lastTracked) {
            msg == 'LLM call'
            severity == 'INFO'
            data.outcome == 'complete'
            data.inputTokens == 12
            data.outputTokens == 34
        }
    }

    def 'a call that fails upstream releases its stream slot, and is tracked at WARN'() {
        given:
        loginAs(unlimited)
        service.streamClient = fakeClient { throw new IOException('Connection refused') }

        when:
        service.stream([messages: [[role: 'user', content: 'Hi']]], unlimited) { true }

        then:
        thrown(RoutineRuntimeException)
        with(testTrackService.lastTracked) {
            msg == 'LLM call'
            severity == 'WARN'
            data.outcome == 'failed'
            data.error.contains('not available')
        }

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
        with(testTrackService.lastTracked) {
            severity == 'WARN'
            data.outcome == 'refused'
        }

        when: 'the limit is untouched'
        2.times { service.reserveCall(member) }

        then:
        noExceptionThrown()
    }

    def 'messages may hold only text, tool and thinking blocks'() {
        expect:
        service.createBody(request([[type: 'text', text: 'Hi']]), llmConfig)
        service.createBody(request([
            [type: 'thinking', thinking: '...', signature: 'abc'],
            [type: 'tool_use', id: 't1', name: 'get_weather', input: [:]]
        ]), llmConfig)

        when:
        service.createBody(request([[type: 'image', source: [:]]]), llmConfig)

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('image')

        when:
        service.createBody(request([[type: 'server_tool_use', id: 's1', name: 'web_search']]), llmConfig)

        then:
        thrown(RoutineRuntimeException)
    }

    def 'a conversation of more than maxMessages messages is too long'() {
        when:
        service.createBody([messages: (1..201).collect { [role: 'user', content: 'Hi'] }], llmConfig)

        then:
        def e = thrown(RoutineRuntimeException)
        e.message.contains('too long')
    }

    def 'the server sets the model and max tokens, and adds its request params'() {
        given:
        setLlmConfig(requestParams: [output_config: [effort: 'low']])

        when:
        def body = service.createBody([model: 'other', max_tokens: 99, messages: [[role: 'user', content: 'Hi']]], llmConfig)

        then:
        body.model == 'test-model'
        body.max_tokens == 1000
        body.stream == true
        body.output_config == [effort: 'low']
        !body.containsKey('tools')
    }

    //------------------
    // Implementation
    //------------------
    private void setLlmConfig(Map overrides = [:]) {
        testConfigService.set('llmConfig', [model: 'test-model', maxTokens: 1000, rateLimit: 2] + overrides)
    }

    private LlmConfig getLlmConfig() {
        service.config
    }

    /** An HTTP client that answers every request with the SSE text from `body`, as status 200. */
    private CloseableHttpClient fakeClient(Closure<String> body) {
        new CloseableHttpClient() {
            protected CloseableHttpResponse doExecute(HttpHost target, ClassicHttpRequest request, HttpContext context) {
                def response = new BasicClassicHttpResponse(200)
                response.entity = new StringEntity(body(), UTF_8)
                CloseableHttpResponse.adapt(response)
            }
            void close(CloseMode closeMode) {}
            void close() {}
        }
    }

    private String sse(Map event) {
        "event: ${event.type}\ndata: ${JSONSerializer.serialize(event)}\n\n"
    }

    private Map request(List<Map> content) {
        [messages: [[role: 'user', content: 'Hi'], [role: 'assistant', content: content]]]
    }
}
