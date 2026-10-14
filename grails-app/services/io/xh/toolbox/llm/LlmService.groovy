package io.xh.toolbox.llm

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.exception.ExternalHttpException
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.json.JSONParser
import io.xh.hoist.json.JSONSerializer
import org.apache.hc.client5.http.classic.methods.HttpPost
import org.apache.hc.client5.http.config.ConnectionConfig
import org.apache.hc.client5.http.config.RequestConfig
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse
import org.apache.hc.client5.http.impl.classic.HttpClients
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder
import org.apache.hc.core5.http.ConnectionRequestTimeoutException
import org.apache.hc.core5.http.io.entity.StringEntity
import org.apache.hc.core5.util.Timeout

import static io.xh.hoist.util.StringUtils.elide
import static java.nio.charset.StandardCharsets.UTF_8

/**
 * Relays the Anthropic Messages API as a token stream, for the Toolbox chats built on
 * `@xh/hoist-chat-kit`: the Weather V2 Dashboard Agent and the Chat Kit app's live demo. The API key
 * lives in the `llmApiKey` config, so it never reaches the client.
 *
 * Request policy - the browser builds the request body, with the kit's `AnthropicCodec`, so the
 * service treats it as untrusted:
 *   - It forwards only `system`, `messages`, `tools` and `tool_choice`. It drops `model`,
 *     `max_tokens` and `stream`, which a codec may send, and rejects a request with any other key.
 *   - It sets `model`, `max_tokens` and `stream` from config. Other request params, such as
 *     `thinking` or `temperature`, come only from the `llmRequestParams` config.
 *   - It accepts only client tools, sent as `{name, description, input_schema}`. Anthropic server
 *     tools, such as web search or code execution, cost extra and reach other systems. The server
 *     adds those enabled in the `llmServerTools` config, and rejects any the client sends.
 *   - It caps the size of the request and the number of messages.
 *   - It limits each user to `llmRateLimit` model calls per hour. The count is per server instance,
 *     not shared across the cluster, and a tool loop makes one call per step.
 *
 * Errors - expected failures throw routine exceptions, which log at DEBUG and which the client does
 * not report as errors: a rate limit hit, a rejected request, a full connection pool, and an
 * upstream that is busy or down (429, 529, 5xx or unreachable). An upstream failure also logs one
 * WARN line. Any other upstream rejection, such as a bad key or a malformed request, throws an
 * `ExternalHttpException`, as it needs a fix.
 *
 * Config entries (created with defaults by BootStrap):
 *   - llmApiKey (pwd): Anthropic API key.
 *   - llmModel (string): Model identifier.
 *   - llmMaxTokens (int): Max response tokens per model call.
 *   - llmRateLimit (int): Max model calls per user per hour.
 *   - llmMaxStreams (int): Max concurrent streams. A request beyond it fails at once, routinely.
 *   - llmRequestParams (json): Other Messages API params to send, such as `thinking`.
 *   - llmServerTools (json): Anthropic server tool definitions to add to every request.
 */
class LlmService extends BaseService {

    String telemetryPrefix = 'toolbox.llm'

    static clearCachesConfigs = [
        'llmApiKey', 'llmModel', 'llmMaxTokens', 'llmRateLimit', 'llmMaxStreams',
        'llmRequestParams', 'llmServerTools'
    ]

    ConfigService configService

    // Simple per-user rate limiter: username -> timestamps of recent model calls.
    private Map<String, List<Long>> _rateLimitMap = [:].withDefault { [] }

    // The pool size is the cap on concurrent streams. Its limits are set from config on init and
    // on config change. A request that finds the pool full waits briefly, then fails.
    private final PoolingHttpClientConnectionManager connectionManager =
        PoolingHttpClientConnectionManagerBuilder.create()
            .setDefaultConnectionConfig(
                ConnectionConfig.custom().setConnectTimeout(Timeout.ofSeconds(10)).build()
            )
            .build()

    // A raw client, as JSONClient reads the whole response. The response timeout bounds each read,
    // not the whole stream - Anthropic sends periodic `ping` events. Compression is off, as a
    // compressed stream may be buffered along the way. Not rebuilt by clearCaches() - closing it
    // would cut off streams in flight.
    private final CloseableHttpClient streamClient = HttpClients.custom()
        .setConnectionManager(connectionManager)
        .disableContentCompression()
        .setDefaultRequestConfig(
            RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofSeconds(5))
                .setResponseTimeout(Timeout.ofMinutes(2))
                .build()
        )
        .build()

    @Override
    protected void init() {
        applyStreamLimit()
    }

    /**
     * Stream a response from the LLM, relaying each Anthropic server-sent event as it arrives.
     *
     * Opens the upstream stream before returning any data, so a missing key, exceeded rate limit
     * or rejected request throws before `onEvent` is first called. Upstream `error` events that
     * arrive mid-stream are relayed like any other event.
     *
     * @param request - Anthropic Messages request body, as built by the kit's `AnthropicCodec`.
     *      Checked and filtered as described in the class doc.
     * @param username - for rate limiting.
     * @param onEvent - called with the JSON payload of each SSE `data:` field, in order. Return
     *      false to stop - e.g. when the client has disconnected. The upstream connection is
     *      then aborted, so no further tokens are generated or billed.
     */
    void stream(Map request, String username, Closure<Boolean> onEvent) {
        checkApiKey()
        checkRateLimit(username)

        def body = createBody(request),
            post = createPost(body)

        span('stream', [model: body.model, toolCount: (body.tools as List)?.size() ?: 0])
            .logDebug("Streaming from Anthropic API with $body.model")
            .run {
                CloseableHttpResponse response = null
                boolean complete = false
                try {
                    response = execute(post)
                    if (response.code != 200) {
                        throw upstreamException(response.code, response.entity?.content?.getText('UTF-8'))
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
    // Request
    //--------------------------------------------------
    /** The request to send upstream - the client's allowed keys plus the server's own settings. */
    private Map createBody(Map request) {
        def disallowed = request.keySet() - CLIENT_KEYS - SERVER_KEYS
        if (disallowed) {
            throw new RoutineRuntimeException("Request key(s) not accepted: ${disallowed.join(', ')}.")
        }

        def messages = request.messages as List
        if (!messages) throw new RoutineRuntimeException('Request has no messages.')
        if (messages.size() > MAX_MESSAGES) {
            throw new RoutineRuntimeException('This conversation is too long. Clear it to start again.')
        }

        def clientTools = (request.tools ?: []) as List<Map>,
            serverTools = configService.getList('llmServerTools', [])
        if (clientTools.any { it.type && it.type != 'custom' }) {
            throw new RoutineRuntimeException('Request includes server tools, which are not accepted.')
        }

        def ret = configService.getMap('llmRequestParams', [:]) + request.subMap(CLIENT_KEYS) + [
            model     : configService.getString('llmModel'),
            max_tokens: configService.getInt('llmMaxTokens'),
            stream    : true
        ]
        ret.tools = serverTools + clientTools
        if (!ret.tools) ret.remove('tools')
        return ret
    }

    private HttpPost createPost(Map body) {
        def json = JSONSerializer.serialize(body)
        if (json.length() > MAX_REQUEST_CHARS) {
            throw new RoutineRuntimeException(
                'This conversation is too large to send. Clear it to start again.'
            )
        }

        def post = new HttpPost('https://api.anthropic.com/v1/messages')
        post.setHeader('Content-Type', 'application/json')
        post.setHeader('x-api-key', configService.getPwd('llmApiKey'))
        post.setHeader('anthropic-version', '2023-06-01')
        post.setEntity(new StringEntity(json, UTF_8))
        return post
    }

    //--------------------------------------------------
    // Response
    //--------------------------------------------------
    private CloseableHttpResponse execute(HttpPost post) {
        try {
            return streamClient.execute(post)
        } catch (ConnectionRequestTimeoutException ignored) {
            logWarn('LLM stream limit reached', [llmMaxStreams: configService.getInt('llmMaxStreams')])
            throw new RoutineRuntimeException(BUSY_MSG)
        } catch (IOException e) {
            logWarn('Anthropic API unreachable', [error: e])
            throw new RoutineRuntimeException(UNAVAILABLE_MSG)
        }
    }

    /**
     * The exception for an upstream error status. Its message stands alone for the user, as the
     * upstream status is not passed through - an upstream 401 would read as a Hoist auth failure.
     */
    private Exception upstreamException(int status, String responseText) {
        def error = parseError(responseText)
        if (status in [429, 529] || status >= 500) {
            logWarn('Anthropic API unavailable', [status: status, error: error])
            return new RoutineRuntimeException(status >= 500 && status != 529 ? UNAVAILABLE_MSG : BUSY_MSG)
        }
        return new ExternalHttpException("The LLM API rejected the request: $error", null, status)
    }

    /** The type and message of an Anthropic error body, or the start of the raw text. */
    private String parseError(String responseText) {
        try {
            Map error = JSONParser.parseObject(responseText).error as Map
            if (error?.message) return error.type ? "${error.message} [${error.type}]" : error.message
        } catch (Exception ignored) {}
        return elide(responseText ?: 'no details', 300)
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
    // Limits
    //--------------------------------------------------
    private synchronized void checkRateLimit(String username) {
        def limit = configService.getInt('llmRateLimit'),
            oneHourAgo = System.currentTimeMillis() - 3600_000,
            userRequests = _rateLimitMap[username]

        userRequests.removeAll { it < oneHourAgo }
        if (userRequests.size() >= limit) {
            throw new RoutineRuntimeException(
                "You have reached the limit of $limit assistant requests per hour. Try again later."
            )
        }
    }

    private synchronized void recordRequest(String username) {
        _rateLimitMap[username] << System.currentTimeMillis()
    }

    private void applyStreamLimit() {
        def max = configService.getInt('llmMaxStreams')
        connectionManager.maxTotal = max
        connectionManager.defaultMaxPerRoute = max
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
        _rateLimitMap.clear()
        applyStreamLimit()
    }

    @Override
    void destroy() {
        streamClient.close()
        super.destroy()
    }

    @Override
    Map getAdminStats() {
        def streams = connectionManager.totalStats
        return [
            config : configForAdminStats(*clearCachesConfigs),
            streams: [active: streams.leased, waiting: streams.pending, max: streams.max]
        ]
    }

    /** Request keys forwarded from the client. */
    private static final List<String> CLIENT_KEYS = ['system', 'messages', 'tools', 'tool_choice']

    /** Request keys a codec may send, which the server always sets itself. */
    private static final List<String> SERVER_KEYS = ['model', 'max_tokens', 'stream']

    private static final int MAX_MESSAGES = 400
    private static final int MAX_REQUEST_CHARS = 4_000_000

    private static final String BUSY_MSG = 'The model is busy. Try again in a minute.'
    private static final String UNAVAILABLE_MSG = 'The model is not available right now. Try again in a few minutes.'
}
