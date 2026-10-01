package io.xh.toolbox.llm

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import org.apache.hc.client5.http.classic.methods.HttpPost
import org.apache.hc.core5.http.io.entity.StringEntity

/**
 * Proxy service for LLM API calls.
 *
 * Proxies requests to the Anthropic Messages API. The API key is stored in a
 * Hoist config entry ('llmApiKey') so it never reaches the client. Supports
 * basic per-user rate limiting via an in-memory counter map - per server instance,
 * not shared across the cluster.
 *
 * Config entries (created with defaults by BootStrap):
 *   - llmApiKey (pwd): Anthropic API key.
 *   - llmModel (string): Model identifier, default 'claude-sonnet-4-6'.
 *   - llmMaxTokens (int): Max response tokens, default 8192.
 *   - llmRateLimit (int): Max requests per user per hour, default 20.
 */
class LlmService extends BaseService {

    String telemetryPrefix = 'toolbox.llm'

    static clearCachesConfigs = ['llmApiKey', 'llmModel', 'llmMaxTokens', 'llmRateLimit']

    ConfigService configService

    // Simple per-user rate limiter: username → list of timestamps
    private Map<String, List<Long>> _rateLimitMap = [:].withDefault { [] }

    private JSONClient _jsonClient
    private JSONClient getClient() {
        _jsonClient ?= new JSONClient()
    }

    /**
     * Generate a response from the LLM.
     *
     * @param systemPrompt - system message for the LLM
     * @param messages - conversation messages [{role: 'user'|'assistant', content: '...'}]
     * @param username - for rate limiting
     * @param tools - optional list of tool definitions for function calling
     * @return parsed response map from the Anthropic API
     */
    Map generate(String systemPrompt, List<Map> messages, String username, List<Map> tools = null) {
        checkApiKey()
        checkRateLimit(username)

        def model = configService.getString('llmModel'),
            maxTokens = configService.getInt('llmMaxTokens'),
            apiKey = configService.getPwd('llmApiKey')

        def body = [
            model     : model,
            max_tokens: maxTokens,
            system    : systemPrompt,
            messages  : messages
        ]

        if (tools) {
            body.tools = tools
        }

        def serialized = JSONSerializer.serialize(body)

        def post = new HttpPost('https://api.anthropic.com/v1/messages')
        post.setHeader('Content-Type', 'application/json')
        post.setHeader('x-api-key', apiKey)
        post.setHeader('anthropic-version', '2023-06-01')
        post.setEntity(new StringEntity(serialized))

        try {
            def response = span('generate', [model: model, toolCount: tools?.size() ?: 0])
                .logDebug("Calling Anthropic API with $model")
                .run { client.executeAsMap(post) }
            recordRequest(username)
            return response
        } catch (Exception e) {
            logError("LLM API call failed", e)
            throw new RuntimeException("LLM API call failed: ${e.message}")
        }
    }

    //--------------------------------------------------
    // Rate limiting
    //--------------------------------------------------
    private synchronized void checkRateLimit(String username) {
        def limit = configService.getInt('llmRateLimit'),
            now = System.currentTimeMillis(),
            oneHourAgo = now - 3600_000

        // Prune old entries
        def userRequests = _rateLimitMap[username]
        userRequests.removeAll { it < oneHourAgo }

        if (userRequests.size() >= limit) {
            throw new RuntimeException(
                "Rate limit exceeded. Max ${limit} requests per hour. Please wait and try again."
            )
        }
    }

    private synchronized void recordRequest(String username) {
        _rateLimitMap[username] << System.currentTimeMillis()
    }

    private void checkApiKey() {
        def key = configService.getPwd('llmApiKey')
        if (!key?.trim() || key == 'UNCONFIGURED') {
            throw new DataNotAvailableException(
                'LLM API key not configured. Set the "llmApiKey" config entry in the Hoist Admin console.'
            )
        }
    }

    @Override
    void clearCaches() {
        super.clearCaches()
        _jsonClient = null
        _rateLimitMap.clear()
    }

    @Override
    Map getAdminStats() {[
        config: configForAdminStats('llmApiKey', 'llmModel', 'llmMaxTokens', 'llmRateLimit')
    ]}
}
