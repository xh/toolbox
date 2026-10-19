package io.xh.toolbox.llm

import io.xh.hoist.exception.RoutineException
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

import static java.nio.charset.StandardCharsets.UTF_8

/**
 * Relays the Anthropic Messages API for the Toolbox chats built on `@xh/hoist-chat-kit`: the
 * Weather V2 Dashboard Agent and the Chat Kit app's live demo. LlmService holds the API key, checks
 * each request and applies the limits.
 *
 * Access is `@AccessAll` here, as an annotation cannot express its rule: the `TOOLBOX_LLM_USER`
 * role, or any user while the `llmOpenToAllUsers` config is true. `LlmService.checkAccess` applies
 * it, first thing in every action.
 */
@AccessAll
class LlmController extends BaseController {

    def llmService

    /**
     * POST /llm/stream
     * Body: Anthropic Messages request body, as built by the kit's `AnthropicCodec`. See LlmService
     *      for the keys it accepts - the server sets `model`, `max_tokens` and `stream`.
     * Returns: NDJSON - one Anthropic stream event per line, flushed as each arrives.
     *
     * Hoist's `renderNDJSON` buffers its output, which holds back a token stream, so this action
     * writes and flushes each line itself. The response commits on the first line, so a failure
     * before then renders a normal Hoist error response. A failure after it ends the stream with an
     * Anthropic `error` event, which the client shows as the reason the reply stopped.
     */
    def stream() {
        llmService.checkAccess(authUser)
        llmService.checkRequestSize(request.contentLengthLong)
        def body = parseRequestJSON()

        response.contentType = 'application/x-ndjson'
        response.characterEncoding = 'UTF-8'
        // Ask an nginx proxy not to buffer the stream.
        response.setHeader('X-Accel-Buffering', 'no')

        OutputStream out = null
        try {
            llmService.stream(body, authUser) { String event ->
                try {
                    out = out ?: response.outputStream
                    out.write((event + '\n').getBytes(UTF_8))
                    out.flush()
                    return true
                } catch (IOException ignored) {
                    // Client has disconnected or aborted - tell the service to stop.
                    return false
                }
            }
        } catch (Exception e) {
            if (!response.committed) throw e
            logWarn('LLM stream failed after the reply started', [error: e])
            writeError(e instanceof RoutineException ? e.message : 'The reply stopped on a server error.')
        }
    }

    //------------------------
    // Implementation
    //------------------------
    /** End a committed stream with an Anthropic `error` event, as the upstream API would. */
    private void writeError(String message) {
        def event = [type: 'error', error: [type: 'api_error', message: message]]
        try {
            def out = response.outputStream
            out.write((JSONSerializer.serialize(event) + '\n').getBytes(UTF_8))
            out.flush()
        } catch (IOException ignored) {
            // Client has gone - nothing more to tell it.
        }
    }
}
