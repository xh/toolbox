package io.xh.toolbox.guide

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

/**
 * Tests the bounds the guideline assistant emulator puts on what a client can store in memory.
 */
class GuideServiceSpec extends Specification implements ServiceUnitTest<GuideService>, HoistUnitTest {

    def 'a session id or idempotency key over 100 characters is rejected'() {
        when:
        service.query([question: 'Hi', sessionId: 'x' * 101], 'alice') { true }

        then:
        thrown(RoutineRuntimeException)

        when:
        service.query([question: 'Hi', idempotencyKey: 'x' * 101], 'alice') { true }

        then:
        thrown(RoutineRuntimeException)
    }

    def 'a chat keeps its last 100 answers'() {
        given:
        def chat = new GuideChat('s1', 'Title')

        when:
        (1..105).each { chat.addMessage([queryId: "q$it"]) }

        then:
        chat.messages.size() == GuideChat.MAX_MESSAGES
        chat.messages.first().queryId == 'q6'
    }
}
