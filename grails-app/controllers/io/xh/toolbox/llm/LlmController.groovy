package io.xh.toolbox.llm

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

import static java.nio.charset.StandardCharsets.UTF_8

/**
 * Controller proxying LLM API requests from the Weather V2 dashboard.
 *
 * Forwards requests to LlmService for the Anthropic API call and rate limiting.
 */
@AccessAll
class LlmController extends BaseController {

    def llmService

    /**
     * POST /llm/generate
     * Body: {systemPrompt: string, messages: [{role, content}], tools?: [...]}
     * Returns: Anthropic API response
     */
    def generate() {
        def body = parseRequestJSON()
        def systemPrompt = body.systemPrompt as String
        def messages = body.messages as List<Map>
        def tools = body.tools as List<Map>

        if (!systemPrompt) throw new RuntimeException('systemPrompt is required.')
        if (!messages) throw new RuntimeException('messages array is required.')

        def username = authUsername
        renderJSON(llmService.generate(systemPrompt, messages, username, tools))
    }

    /**
     * POST /llm/stream
     * Body: Anthropic Messages request body - {system?, messages, tools?, ...}. The server sets
     *      `model`, `max_tokens` and `stream`.
     * Returns: NDJSON - one Anthropic stream event per line, flushed as each arrives.
     *
     * Hoist's `renderNDJSON` buffers its output, which holds back a token stream, so this action
     * writes and flushes each line itself. It follows the same error contract: the response
     * commits on the first line, so earlier failures render a normal error response, and a
     * mid-stream failure ends the stream with a non-JSON line that fails client-side parsing.
     */
    def stream() {
        def body = parseRequestJSON()
        if (!body.messages) throw new RuntimeException('messages array is required.')

        response.contentType = 'application/x-ndjson'
        response.characterEncoding = 'UTF-8'

        OutputStream out = null
        try {
            llmService.stream(body, authUsername) { String event ->
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
        } catch (Throwable t) {
            if (response.committed) {
                try {
                    out.write(NDJSON_POISON.getBytes(UTF_8))
                    out.flush()
                } catch (Throwable ignored) {}
            }
            throw t
        }
    }

    /** Matches the line hoist-core's `renderNDJSON` writes, which `fetchNdjson` rejects. */
    private static final String NDJSON_POISON = '//xh-ndjson-stream-error'
}
