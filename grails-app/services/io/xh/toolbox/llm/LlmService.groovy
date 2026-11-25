package io.xh.toolbox.llm

import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.config.ConfigService
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.exception.ExternalHttpException
import io.xh.hoist.exception.RoutineException
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.json.JSONParser
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.telemetry.trace.SpanRef
import io.xh.hoist.track.TrackService
import io.xh.hoist.user.HoistUser
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

import static io.opentelemetry.api.trace.SpanKind.CLIENT
import static io.xh.hoist.util.DateTimeUtils.HOURS
import static io.xh.hoist.util.StringUtils.elide
import static java.lang.System.currentTimeMillis
import static java.nio.charset.StandardCharsets.UTF_8

/**
 * Relays the Anthropic Messages API as a token stream, for the Live Model demo on the desktop app's
 * Chat Kit tab, built on `@xh/hoist-chat-kit`. The API key lives in the `llmApiKey` config, so it
 * never reaches the client.
 *
 * Access - {@link LlmController} requires the `ACCESS_LLM_FEATURES` role.
 * `ACCESS_LLM_FEATURES_UNLIMITED` grants it too, and exempts its members from the hourly limit.
 * Both roles go to HOIST_ADMIN members.
 *
 * Request policy - the browser builds the request body, with the kit's `AnthropicCodec`, so the
 * service treats it as untrusted:
 *   - It forwards only `system`, `messages`, `tools` and `tool_choice`. It drops `model`,
 *     `max_tokens` and `stream`, which a codec may send, and rejects a request with any other key.
 *   - It sets `model`, `max_tokens` and `stream` from config. Other request params, such as
 *     `output_config`, come only from `LlmConfig.requestParams`.
 *   - It accepts only client tools, sent as `{name, description, input_schema}`. Anthropic server
 *     tools, such as web search or code execution, cost extra and reach other systems.
 *   - It caps the size of the request and the number of messages, and accepts only text, tool and
 *     thinking content blocks.
 *   - It limits each user to `LlmConfig.rateLimit` model calls per hour, counted from the moment a
 *     call is admitted, whether or not it succeeds. The count is shared across the cluster. A tool
 *     loop makes one call per step. Members of `ACCESS_LLM_FEATURES_UNLIMITED` have no hourly
 *     limit. With a limit of 0, only they can make calls.
 *   - It limits each user to `LlmConfig.maxStreamsPerUser` streams at once, per server instance.
 *
 * Observability - each request runs in one CLIENT span and makes one track entry, in category
 * `LLM`. The entry's `outcome` is `complete`, `aborted` (the client went away), `refused` (a limit
 * or the policy stopped it before the upstream call) or `failed`. Refused and failed requests track
 * at WARN and mark the span as an error. Token counts go on both.
 *
 * Errors - expected failures throw routine exceptions, which log at DEBUG and which the client does
 * not report as errors: a limit hit, a rejected request, a full connection pool, and an upstream
 * that is busy or down (429, 529, 5xx or unreachable). An upstream failure also logs one WARN line.
 * Any other upstream rejection, such as a bad key or a malformed request, throws an
 * `ExternalHttpException`, as it needs a fix.
 *
 * Config entries (created by BootStrap):
 *   - llmApiKey (pwd): Anthropic API key.
 *   - llmConfig (json): Model, request params and limits - see {@link LlmConfig}.
 */
class LlmService extends BaseService {

    /** Anthropic Messages API endpoint. */
    static final String API_URL = 'https://api.anthropic.com/v1/messages'

    /**
     * Anthropic API version, sent as the `anthropic-version` header. A new version can change the
     * request and response format, so moving to one is a code change - see
     * https://platform.claude.com/docs/en/api/versioning.
     */
    static final String API_VERSION = '2026-10-21'

    static final String UNLIMITED_ROLE = 'ACCESS_LLM_FEATURES_UNLIMITED'

    static clearCachesConfigs = ['llmApiKey', 'llmConfig']

    String telemetryPrefix = 'toolbox.llm'

    ConfigService configService
    TrackService trackService

    // Username -> times of the calls admitted in the last hour. Replicated, so the hourly limit
    // holds when one user reaches more than one instance, e.g. from a second browser.
    private Cache<String, List<Long>> callTimes

    // Username -> streams in progress on this instance, guarded by this service's lock. Not
    // replicated: each stream holds a request thread here, and a shared count would outlive an
    // instance that stopped.
    private final Map<String, Integer> activeStreams = [:]

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
    // would cut off streams in flight. Not final, so that tests can swap in a fake.
    private CloseableHttpClient streamClient = HttpClients.custom()
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
        callTimes = createCache(name: 'callTimes', replicate: true, expireTime: HOURS)
        applyStreamLimit()
    }

    /**
     * Reject a request body larger than `LlmConfig.maxRequestKb`, before it is parsed. A body of
     * unknown length (-1), such as a chunked one, is rejected too - a browser always sends one.
     */
    void checkRequestSize(long bytes) {
        if (bytes < 0 || bytes > config.maxRequestKb * 1024L) {
            throw new RoutineRuntimeException(TOO_LARGE_MSG)
        }
    }

    /**
     * Stream a response from the LLM, relaying each Anthropic server-sent event as it arrives.
     *
     * Opens the upstream stream before returning any data, so a missing key, exceeded limit or
     * rejected request throws before `onEvent` is first called. Upstream `error` events that arrive
     * mid-stream are relayed like any other event.
     *
     * @param request - Anthropic Messages request body, as built by the kit's `AnthropicCodec`.
     *      Checked and filtered as described in the class doc.
     * @param user - the authenticated user, for limits.
     * @param onEvent - called with the JSON payload of each SSE `data:` field, in order. Return
     *      false to stop - e.g. when the client has disconnected. The upstream connection is
     *      then aborted, so no further tokens are generated or billed.
     */
    void stream(Map request, HoistUser user, Closure<Boolean> onEvent) {
        def config = getConfig(),
            data = [model: config.model, toolCount: (request.tools as List)?.size() ?: 0],
            startTime = currentTimeMillis(),
            outcome = 'refused'

        span(
            name: 'stream',
            kind: CLIENT,
            tags: [
                'gen_ai.operation.name': 'chat',
                'gen_ai.request.model' : config.model,
                'server.address'       : 'api.anthropic.com'
            ]
        ).logDebug("Streaming from Anthropic API with $config.model").run { SpanRef span ->
            try {
                checkApiKey()
                def post = createPost(createBody(request, config))
                reserveCall(user)
                try {
                    outcome = 'failed'
                    def usage = relay(post, onEvent, span)
                    outcome = usage == null ? 'aborted' : 'complete'
                    data += tokenCounts(usage)
                    span.setTags([
                        'gen_ai.usage.input_tokens' : usage?.input_tokens,
                        'gen_ai.usage.output_tokens': usage?.output_tokens
                    ].findAll { it.value != null })
                } finally {
                    releaseCall(user.username)
                }
                track(outcome, data, startTime)
            } catch (Throwable t) {
                // The span records any other exception itself.
                if (t instanceof RoutineException) span.setErrorStatus(t.message)
                track(outcome, data + [error: t.message], startTime)
                throw t
            }
        }
    }

    //--------------------------------------------------
    // Request
    //--------------------------------------------------
    /** The request to send upstream - the client's allowed keys plus the server's own settings. */
    private Map createBody(Map request, LlmConfig config) {
        def disallowed = request.keySet() - CLIENT_KEYS - SERVER_KEYS
        if (disallowed) {
            throw new RoutineRuntimeException("Request key(s) not accepted: ${disallowed.join(', ')}.")
        }

        def messages = request.messages as List
        if (!messages) throw new RoutineRuntimeException('Request has no messages.')
        if (messages.size() > config.maxMessages) {
            throw new RoutineRuntimeException('This conversation is too long. Clear it to start again.')
        }

        if ((request.tools as List<Map>)?.any { it.type && it.type != 'custom' }) {
            throw new RoutineRuntimeException('Request includes server tools, which are not accepted.')
        }
        checkContentBlocks(messages)

        def ret = config.requestParams + request.subMap(CLIENT_KEYS) + [
            model     : config.model,
            max_tokens: config.maxTokens,
            stream    : true
        ]
        if (!ret.tools) ret.remove('tools')
        return ret
    }

    /**
     * Accept only the content blocks the chats send: text, tool calls and results, and the model's
     * own thinking, which goes back with its signature.
     */
    private void checkContentBlocks(List messages) {
        messages.each { message ->
            def content = (message as Map)?.content
            if (content instanceof String) return
            if (!(content instanceof List)) {
                throw new RoutineRuntimeException('Request has a message with no content.')
            }
            content.each { block ->
                def type = (block as Map)?.type as String
                if (!(type in CONTENT_TYPES)) {
                    throw new RoutineRuntimeException("Message content type not accepted: $type.")
                }
            }
        }
    }

    private HttpPost createPost(Map body) {
        def post = new HttpPost(API_URL)
        post.setHeader('Content-Type', 'application/json')
        post.setHeader('x-api-key', configService.getPwd('llmApiKey'))
        post.setHeader('anthropic-version', API_VERSION)
        post.setEntity(new StringEntity(JSONSerializer.serialize(body), UTF_8))
        return post
    }

    //--------------------------------------------------
    // Response
    //--------------------------------------------------
    /**
     * Send the request and relay its events. Returns the token counts, or null if the client went
     * away first.
     */
    private Map relay(HttpPost post, Closure<Boolean> onEvent, SpanRef span) {
        def usage = [:],
            complete = false
        CloseableHttpResponse response = null
        try {
            response = execute(post)
            span.setHttpStatusAndErrorStatus(response.code)
            if (response.code != 200) {
                throw upstreamException(response.code, response.entity?.content?.getText('UTF-8'))
            }
            complete = relayEvents(response, onEvent, usage)
            if (!complete) logInfo('Client disconnected - aborted LLM stream')
            return complete ? usage : null
        } finally {
            // Abort rather than drain: closing an unread response reads it to the end.
            if (!complete) post.abort()
            try { response?.close() } catch (Exception ignored) {}
        }
    }

    private CloseableHttpResponse execute(HttpPost post) {
        try {
            return streamClient.execute(post)
        } catch (ConnectionRequestTimeoutException ignored) {
            logWarn('LLM stream limit reached', [maxStreams: config.maxStreams])
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
     * Parse the SSE stream and pass each event's data to the callback, noting the token counts in
     * `usage`. Returns true if the stream ended normally, false if the callback asked to stop.
     */
    private boolean relayEvents(CloseableHttpResponse response, Closure<Boolean> onEvent, Map usage) {
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
                if (!relayEvent(data.toString(), onEvent, usage)) return false
                data.setLength(0)
            }
        }
        return !data || relayEvent(data.toString(), onEvent, usage)
    }

    private boolean relayEvent(String event, Closure<Boolean> onEvent, Map usage) {
        readUsage(event, usage)
        return onEvent(event)
    }

    /**
     * Note the token counts from a `message_start` or `message_delta` event. The delta's output
     * count is the total so far, so a later one replaces an earlier one.
     */
    private void readUsage(String event, Map usage) {
        if (!event.contains('"message_start"') && !event.contains('"message_delta"')) return
        try {
            Map parsed = JSONParser.parseObject(event),
                counts = (parsed.type == 'message_start' ? (parsed.message as Map)?.usage : parsed.usage) as Map
            counts?.each { k, v -> if (v instanceof Number) usage[k] = v }
        } catch (Exception ignored) {}
    }

    //--------------------------------------------------
    // Limits
    //--------------------------------------------------
    /**
     * Admit a call within the user's limits, counting it at once, so that parallel requests cannot
     * all pass the check. Release it with {@link #releaseCall}.
     */
    private synchronized void reserveCall(HoistUser user) {
        def config = getConfig(),
            username = user.username
        if ((activeStreams[username] ?: 0) >= config.maxStreamsPerUser) {
            throw new RoutineRuntimeException('Too many of your replies are running at once. Wait for one to finish.')
        }

        if (!user.hasRole(UNLIMITED_ROLE)) {
            def limit = config.rateLimit,
                now = currentTimeMillis(),
                times = (callTimes.get(username) ?: []).findAll { it > now - HOURS }
            if (times.size() >= limit) {
                throw new RoutineRuntimeException(
                    limit > 0 ?
                        "You have reached the limit of $limit assistant requests per hour. Try again later." :
                        'The assistant is not available right now.'
                )
            }
            callTimes.put(username, times + now)
        }

        activeStreams[username] = (activeStreams[username] ?: 0) + 1
    }

    private synchronized void releaseCall(String username) {
        def count = (activeStreams[username] ?: 1) - 1
        count ? activeStreams.put(username, count) : activeStreams.remove(username)
    }

    //--------------------------------------------------
    // Implementation
    //--------------------------------------------------
    private void track(String outcome, Map data, long startTime) {
        trackService.track(
            category: 'LLM',
            msg: 'LLM call',
            severity: outcome in ['refused', 'failed'] ? 'WARN' : 'INFO',
            elapsed: currentTimeMillis() - startTime,
            data: data + [outcome: outcome]
        )
    }

    /** The token counts of a call, as tracked, leaving out any it did not report. */
    private Map tokenCounts(Map usage) {
        [
            inputTokens     : usage?.input_tokens,
            cacheReadTokens : usage?.cache_read_input_tokens,
            cacheWriteTokens: usage?.cache_creation_input_tokens,
            outputTokens    : usage?.output_tokens
        ].findAll { it.value != null }
    }

    private LlmConfig getConfig() {
        configService.getObject(LlmConfig)
    }

    private void applyStreamLimit() {
        def max = config.maxStreams
        connectionManager.maxTotal = max
        connectionManager.defaultMaxPerRoute = max
    }

    private void checkApiKey() {
        def key = configService.getPwd('llmApiKey')
        if (!key?.trim() || key == 'UNCONFIGURED') {
            throw new DataNotAvailableException(
                'LLM API key not configured. Set the "llmApiKey" config in the Admin Console, or ' +
                    'APP_TOOLBOX_LLM_API_KEY in .env for local development.'
            )
        }
    }

    @Override
    void clearCaches() {
        // Keeps the per-user counts, so a config change does not reset anyone's limit.
        super.clearCaches()
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
            config : configForAdminStats('llmApiKey', 'llmConfig'),
            streams: [active: streams.leased, waiting: streams.pending, max: streams.max]
        ]
    }

    /** Request keys forwarded from the client. */
    private static final List<String> CLIENT_KEYS = ['system', 'messages', 'tools', 'tool_choice']

    /** Request keys a codec may send, which the server always sets itself. */
    private static final List<String> SERVER_KEYS = ['model', 'max_tokens', 'stream']

    /** Content block types accepted in messages - see {@link #checkContentBlocks}. */
    private static final List<String> CONTENT_TYPES = [
        'text', 'tool_use', 'tool_result', 'thinking', 'redacted_thinking'
    ]

    private static final String TOO_LARGE_MSG = 'This conversation is too large to send. Clear it to start again.'
    private static final String BUSY_MSG = 'The model is busy. Try again in a minute.'
    private static final String UNAVAILABLE_MSG = 'The model is not available right now. Try again in a few minutes.'
}
