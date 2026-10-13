package io.xh.toolbox.llm

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import org.apache.hc.client5.http.classic.methods.HttpPost
import org.apache.hc.client5.http.config.RequestConfig
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse
import org.apache.hc.client5.http.impl.classic.HttpClients
import org.apache.hc.core5.http.io.entity.StringEntity
import org.apache.hc.core5.util.Timeout

import static io.xh.hoist.util.StringUtils.elide
import static java.nio.charset.StandardCharsets.UTF_8

/**
 * Proxy service for LLM API calls.
 *
 * Proxies requests to the Anthropic Messages API, either as a single response ({@link #generate})
 * or as a token stream ({@link #stream}). The API key is stored in a Hoist config entry
 * ('llmApiKey') so it never reaches the client. Supports basic per-user rate limiting via an
 * in-memory counter map - per server instance, not shared across the cluster.
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

    // Raw client for streaming - JSONClient buffers the whole response. The response timeout
    // bounds each read, not the whole stream; Anthropic sends periodic `ping` events. Compression
    // is off, as a compressed stream may be buffered along the way. Holds no config, so it is not
    // reset by clearCaches() - closing it would cut off streams in flight.
    private final CloseableHttpClient streamClient = HttpClients.custom()
        .disableContentCompression()
        .setDefaultRequestConfig(RequestConfig.custom().setResponseTimeout(Timeout.ofMinutes(2)).build())
        .build()

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
            body = [
                model     : model,
                max_tokens: configService.getInt('llmMaxTokens'),
                system    : systemPrompt,
                messages  : messages
            ]

        if (tools) {
            body.tools = tools
        }

        try {
            def response = span('generate', [model: model, toolCount: tools?.size() ?: 0])
                .logDebug("Calling Anthropic API with $model")
                .run { client.executeAsMap(createPost(body)) }
            recordRequest(username)
            return response
        } catch (Exception e) {
            logError("LLM API call failed", e)
            throw new RuntimeException("LLM API call failed: ${e.message}")
        }
    }

    /**
     * Stream a response from the LLM, relaying each Anthropic server-sent event as it arrives.
     *
     * Opens the upstream stream before returning any data, so a missing key, exceeded rate limit
     * or rejected request throws before `onEvent` is first called. Upstream `error` events that
     * arrive mid-stream are relayed like any other event.
     *
     * @param request - Anthropic Messages request body ({system?, messages, tools?, ...}). The
     *      `model`, `max_tokens` and `stream` keys are always set here from config.
     * @param username - for rate limiting.
     * @param onEvent - called with the JSON payload of each SSE `data:` field, in order. Return
     *      false to stop - e.g. when the client has disconnected. The upstream connection is
     *      then aborted, so no further tokens are generated or billed.
     */
    void stream(Map request, String username, Closure<Boolean> onEvent) {
        checkApiKey()
        checkRateLimit(username)

        def model = configService.getString('llmModel'),
            body = request + [
                model     : model,
                max_tokens: configService.getInt('llmMaxTokens'),
                stream    : true
            ],
            post = createPost(body)

        span('stream', [model: model, toolCount: (request.tools as List)?.size() ?: 0])
            .logDebug("Streaming from Anthropic API with $model")
            .run {
                CloseableHttpResponse response = null
                boolean complete = false
                try {
                    response = streamClient.execute(post)
                    if (response.code != 200) {
                        // Status not passed through - an upstream 401 would read as a Hoist auth failure.
                        def detail = elide(response.entity?.content?.getText('UTF-8') ?: '', 500)
                        throw new RuntimeException("LLM API call failed with status ${response.code}: $detail")
                    }
                    recordRequest(username)
                    complete = relayEvents(response, onEvent)
                    if (!complete) logInfo('Client disconnected - aborted LLM stream')
                } finally {
                    // Abort rather than drain: closing an unread response reads it to the end.
                    if (!complete) post.abort()
                    try { response?.close() } catch (Exception ignored) {}
                }
            }
    }

    //--------------------------------------------------
    // Implementation
    //--------------------------------------------------
    private HttpPost createPost(Map body) {
        def post = new HttpPost('https://api.anthropic.com/v1/messages')
        post.setHeader('Content-Type', 'application/json')
        post.setHeader('x-api-key', configService.getPwd('llmApiKey'))
        post.setHeader('anthropic-version', '2023-06-01')
        post.setEntity(new StringEntity(JSONSerializer.serialize(body), UTF_8))
        return post
    }

    /**
     * Parse the SSE stream and pass each event's data to the callback.
     * Returns true if the stream ended normally, false if the callback asked to stop.
     */
    private boolean relayEvents(CloseableHttpResponse response, Closure<Boolean> onEvent) {
        def reader = new BufferedReader(new InputStreamReader(response.entity.content, UTF_8)),
            data = new StringBuilder()
        String line
        while ((line = reader.readLine()) != null) {
            if (line.startsWith('data:')) {
                // Join multi-line data with a space, not a newline, to keep one event per NDJSON line.
                if (data) data.append(' ')
                data.append(line.substring(5).trim())
            } else if (!line && data) {
                // A blank line ends the event. Lines starting `event:`, `id:` and `:` are ignored -
                // each Anthropic data payload carries its own `type`.
                if (!onEvent(data.toString())) return false
                data.setLength(0)
            }
        }
        return !data || onEvent(data.toString())
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
    void destroy() {
        streamClient.close()
        super.destroy()
    }

    @Override
    Map getAdminStats() {[
        config: configForAdminStats('llmApiKey', 'llmModel', 'llmMaxTokens', 'llmRateLimit')
    ]}
}
