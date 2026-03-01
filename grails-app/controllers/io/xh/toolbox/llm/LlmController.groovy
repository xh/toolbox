package io.xh.toolbox.llm

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

/**
 * Controller proxying LLM API requests from the Weather V2 dashboard.
 *
 * Accepts a JSON body with {systemPrompt, messages} and forwards to
 * LlmService for Anthropic API call + rate limiting.
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
}
