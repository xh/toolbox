package io.xh.toolbox.llm

import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.config.ConfigService
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.exception.ExternalHttpException
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.json.JSONParser
import io.xh.hoist.json.JSONSerializer
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

import static io.xh.hoist.util.DateTimeUtils.DAYS
import static io.xh.hoist.util.DateTimeUtils.HOURS
import static io.xh.hoist.util.DateTimeUtils.appDay
import static io.xh.hoist.util.StringUtils.elide
import static java.nio.charset.StandardCharsets.UTF_8

/**
 * Relays the Anthropic Messages API as a token stream, for the Live Model demo on the desktop app's
 * Chat Kit tab, built on `@xh/hoist-chat-kit`. The API key lives in the `llmApiKey` config, so it
 * never reaches the client. In local development, set it once in `.env` as `APP_TOOLBOX_LLM_API_KEY`,
 * which overrides the config on every start, H2 included.
 *
 * Access - {@link LlmController} requires the `TOOLBOX_LLM_USER` role. `TOOLBOX_LLM_UNLIMITED`
 * grants it too, and exempts its members from the rate limit. Both roles go to HOIST_ADMIN members.
 *
 * Request policy - the browser builds the request body, with the kit's `AnthropicCodec`, so the
 * service treats it as untrusted:
 *   - It forwards only `system`, `messages`, `tools` and `tool_choice`. It drops `model`,
 *     `max_tokens` and `stream`, which a codec may send, and rejects a request with any other key.
 *   - It sets `model`, `max_tokens` and `stream` from config. Other request params, such as
 *     `thinking` or `temperature`, come only from `LlmConfig.requestParams`.
 *   - It accepts only client tools, sent as `{name, description, input_schema}`, and refuses
 *     Anthropic server tools and their blocks in messages, since the client could forge a server
 *     tool's result. Server tools need a signed continuation, which the relay does not have, so
 *     every call fails while `LlmConfig.serverTools` is set.
 *   - It caps the size of the request and the number of messages, and accepts only text, tool and
 *     thinking content blocks.
 *
 * Limits - each from `LlmConfig`, shared across the cluster, and lifted for members of
 * `TOOLBOX_LLM_UNLIMITED` except where noted:
 *   - `rateLimit` model calls per user per hour, counted from the moment a call is admitted, whether
 *     or not it succeeds. A tool loop makes one call per step. With a limit of 0, only unlimited
 *     users can make calls.
 *   - `dailyTokenLimit` tokens per user per app day, counted when each call ends.
 *   - `dailyTokenBudget` tokens per app day across all users, unlimited ones included.
 *   - Two streams at once per user, per server instance. This one applies to every user.
 * {@link #usage} reports a user's standing against them.
 *
 * Tracking - each call is tracked in category `LLM`, with its token counts, and at WARN if it
 * failed. A refused request - a limit hit, or a request the policy rejects - is tracked at WARN,
 * so admins can see it in the Admin Console's Activity tab. Both carry the `app`, `feature` and
 * `blueprintId` the client sends in the `X-Llm-Context` header - see {@link #parseContext}.
 *
 * Errors - expected failures throw routine exceptions, which log at DEBUG and which the client does
 * not report as errors: a rate limit hit, a rejected request, a full connection pool, and an
 * upstream that is busy or down (429, 529, 5xx or unreachable). An upstream failure also logs one
 * WARN line. Any other upstream rejection, such as a bad key or a malformed request, throws an
 * `ExternalHttpException`, as it needs a fix.
 *
 * Config entries (created by BootStrap):
 *   - llmApiKey (pwd): Anthropic API key.
 *   - llmConfig (json): Model, limits, request params and server tools - see {@link LlmConfig}.
 */
class LlmService extends BaseService {

    String telemetryPrefix = 'toolbox.llm'

    static clearCachesConfigs = ['llmApiKey', 'llmConfig']

    static final String UNLIMITED_ROLE = 'TOOLBOX_LLM_UNLIMITED'

    ConfigService configService
    TrackService trackService

    // Each user's use across the cluster: [day, tokens that day, times of calls in the last hour].
    // A replicated cache has no atomic update, so the same user's calls updating it on two
    // instances at once can lose one count - fine for a demo limit. Updated under this service's
    // lock, which also guards the streams each user has in progress on this instance.
    private final Cache<String, Map> _usage = createCache(name: 'usage', replicate: true, expireTime: 2 * DAYS)
    private final Map<String, Integer> _activeStreams = [:]

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
     * Reject a request body larger than any chat should send, before it is parsed. A body of
     * unknown length (-1), such as a chunked one, is rejected too - a browser always sends one.
     */
    void checkRequestSize(long bytes) {
        if (bytes < 0 || bytes > MAX_BODY_BYTES) {
            warn('LLM request too large', [bytes: bytes])
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
     * @param context - the client's `app`, `feature` and `blueprintId`, from {@link #parseContext},
     *      added to what is tracked.
     * @param onEvent - called with the JSON payload of each SSE `data:` field, in order. Return
     *      false to stop - e.g. when the client has disconnected. The upstream connection is
     *      then aborted, so no further tokens are generated or billed.
     */
    void stream(Map request, HoistUser user, Map context, Closure<Boolean> onEvent) {
        checkApiKey()

        Map body
        HttpPost post
        try {
            body = createBody(request)
            post = createPost(body)
        } catch (RoutineRuntimeException e) {
            warn('LLM request refused', [reason: e.message, *: context])
            throw e
        }

        reserveCall(user, context)
        def usage = [:],
            toolCount = (body.tools as List)?.size() ?: 0,
            startTime = System.currentTimeMillis(),
            complete = false
        Throwable error = null
        try {
            span('stream', [model: body.model, toolCount: toolCount])
                .logDebug("Streaming from Anthropic API with $body.model")
                .run {
                    CloseableHttpResponse response = null
                    try {
                        response = execute(post)
                        if (response.code != 200) {
                            throw upstreamException(response.code, response.entity?.content?.getText('UTF-8'))
                        }
                        complete = relayEvents(response, onEvent, usage)
                        if (!complete) logInfo('Client disconnected - aborted LLM stream')
                    } finally {
                        // Abort rather than drain: closing an unread response reads it to the end.
                        if (!complete) post.abort()
                        try { response?.close() } catch (Exception ignored) {}
                    }
                }
        } catch (Throwable t) {
            error = t
            throw t
        } finally {
            releaseCall(user.username)
            addTokens(user.username, usage)
            trackCall(body.model as String, toolCount, usage, complete, error, startTime, context)
        }
    }

    /**
     * A user's standing against the limits: calls in the last hour and tokens today, what is left
     * of each (null for no limit), whether the daily budget has paused the demo for them, and
     * whether they can call now. Streams in progress are not counted.
     */
    synchronized Map usage(HoistUser user) {
        def config = getConfig(),
            use = usageOf(user.username),
            unlimited = user.hasRole(UNLIMITED_ROLE),
            calls = (use.calls as List).size(),
            tokens = use.tokens as long,
            callsLeft = unlimited ? null : Math.max(0, config.rateLimit - calls),
            tokensLeft = unlimited || config.dailyTokenLimit == null ? null : Math.max(0L, config.dailyTokenLimit - tokens),
            paused = !unlimited && budgetReached(config)
        return [
            unlimited : unlimited,
            calls     : calls,
            callsLeft : callsLeft,
            tokens    : tokens,
            tokensLeft: tokensLeft,
            paused    : paused,
            canCall   : !paused && callsLeft != 0 && tokensLeft != 0L
        ]
    }

    /**
     * The client's context for a call, from the `X-Llm-Context` header: JSON with any of `app`,
     * `feature` and `blueprintId`, each a string of at most 100 characters. Anything else, or a
     * malformed header, is dropped, as the context is only tracked.
     */
    Map parseContext(String header) {
        if (!header) return [:]
        try {
            return JSONParser.parseObject(header)
                .subMap(CONTEXT_KEYS)
                .findAll { k, v -> v instanceof String && v.length() <= 100 }
        } catch (Exception ignored) {
            return [:]
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

        def config = getConfig(),
            clientTools = (request.tools ?: []) as List<Map>
        if (config.serverTools) {
            throw new IllegalStateException(
                'llmConfig.serverTools is set, but server tools need a signed continuation, which ' +
                    'the relay does not have. Clear it.'
            )
        }
        if (clientTools.any { it.type && it.type != 'custom' }) {
            throw new RoutineRuntimeException('Request includes server tools, which are not accepted.')
        }
        checkContentBlocks(messages)

        def ret = (config.requestParams ?: [:]) + request.subMap(CLIENT_KEYS) + [
            model     : config.model,
            max_tokens: config.maxTokens,
            stream    : true
        ]
        if (!clientTools) ret.remove('tools')
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
        def json = JSONSerializer.serialize(body)
        if (json.length() > MAX_REQUEST_CHARS) throw new RoutineRuntimeException(TOO_LARGE_MSG)

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
    private void reserveCall(HoistUser user, Map context) {
        def refusal = tryReserve(user)
        if (refusal) {
            warn(refusal.msg as String, (refusal.data as Map) + context)
            throw new RoutineRuntimeException(refusal.error as String)
        }
    }

    /** Count the call and return null, or return why it is refused. */
    private synchronized Map tryReserve(HoistUser user) {
        def username = user.username
        if ((_activeStreams[username] ?: 0) >= MAX_STREAMS_PER_USER) {
            return [
                msg  : 'LLM stream limit hit',
                data : [limit: MAX_STREAMS_PER_USER],
                error: 'You already have two replies running. Wait for one to finish.'
            ]
        }

        def config = getConfig(),
            use = usageOf(username)
        if (!user.hasRole(UNLIMITED_ROLE)) {
            if (budgetReached(config)) {
                return [
                    msg  : 'LLM token budget reached',
                    data : [budget: config.dailyTokenBudget],
                    error: 'The assistant demo has paused for today. Try again tomorrow.'
                ]
            }
            def tokenLimit = config.dailyTokenLimit
            if (tokenLimit != null && use.tokens >= tokenLimit) {
                return [
                    msg  : 'LLM token limit hit',
                    data : [limit: tokenLimit, tokens: use.tokens],
                    error: "You have used today's $tokenLimit assistant tokens. Try again tomorrow."
                ]
            }
            def limit = config.rateLimit
            if ((use.calls as List).size() >= limit) {
                return [
                    msg  : 'LLM rate limit hit',
                    data : [limit: limit],
                    error: limit > 0 ?
                        "You have reached the limit of $limit assistant requests per hour. Try again later." :
                        'The assistant is not available right now.'
                ]
            }
        }

        _usage.put(username, use + [calls: (use.calls as List) + System.currentTimeMillis()])
        _activeStreams[username] = (_activeStreams[username] ?: 0) + 1
        return null
    }

    private synchronized void releaseCall(String username) {
        def count = (_activeStreams[username] ?: 1) - 1
        count ? _activeStreams.put(username, count) : _activeStreams.remove(username)
    }

    /** Add a call's tokens to the user's count for today. */
    private synchronized void addTokens(String username, Map usage) {
        long tokens = totalTokens(usage)
        if (!tokens) return
        def use = usageOf(username)
        _usage.put(username, use + [tokens: (use.tokens as long) + tokens])
    }

    /** A user's use as of now: today's tokens, and the times of calls in the last hour. */
    private Map usageOf(String username) {
        def stored = _usage.get(username),
            today = appDay().toString(),
            cutoff = System.currentTimeMillis() - HOURS
        return [
            day   : today,
            tokens: stored?.day == today ? stored.tokens as long : 0L,
            calls : ((stored?.calls ?: []) as List).findAll { (it as long) > cutoff }
        ]
    }

    private boolean budgetReached(LlmConfig config) {
        def budget = config.dailyTokenBudget
        if (budget == null) return false
        def today = appDay().toString()
        long spent = _usage.map.values().findAll { it.day == today }.sum(0L) { it.tokens as long } as long
        return spent >= budget
    }

    private static long totalTokens(Map usage) {
        ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens']
            .sum(0L) { (usage[it] ?: 0) as long } as long
    }

    //--------------------------------------------------
    // Tracking
    //--------------------------------------------------
    /**
     * Track a model call - at WARN if it failed, or ended before any usage arrived, as when the
     * upstream rejected it.
     */
    private void trackCall(
        String model, int toolCount, Map usage, boolean complete, Throwable error, long startTime, Map context
    ) {
        trackService.track(
            category: 'LLM',
            msg: 'LLM call',
            severity: error || !usage ? 'WARN' : 'INFO',
            elapsed: System.currentTimeMillis() - startTime,
            data: [
                model           : model,
                inputTokens     : usage.input_tokens,
                cacheReadTokens : usage.cache_read_input_tokens,
                cacheWriteTokens: usage.cache_creation_input_tokens,
                outputTokens    : usage.output_tokens,
                tokens          : totalTokens(usage),
                toolCount       : toolCount,
                complete        : complete,
                error           : error?.message,
                *               : context
            ]
        )
    }

    /** Log a refused request, and track it at WARN for admins. */
    private void warn(String msg, Map data = [:]) {
        logInfo(msg, data)
        trackService.track(category: 'LLM', msg: msg, severity: 'WARN', data: data)
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
            config : configForAdminStats(*clearCachesConfigs),
            streams: [active: streams.leased, waiting: streams.pending, max: streams.max]
        ]
    }

    /** Keys of the client's context, tracked with each call. */
    private static final List<String> CONTEXT_KEYS = ['app', 'feature', 'blueprintId']

    /** Request keys forwarded from the client. */
    private static final List<String> CLIENT_KEYS = ['system', 'messages', 'tools', 'tool_choice']

    /** Request keys a codec may send, which the server always sets itself. */
    private static final List<String> SERVER_KEYS = ['model', 'max_tokens', 'stream']

    /** Content block types accepted in messages - see {@link #checkContentBlocks}. */
    private static final List<String> CONTENT_TYPES = [
        'text', 'tool_use', 'tool_result', 'thinking', 'redacted_thinking'
    ]

    private static final int MAX_MESSAGES = 200
    private static final int MAX_REQUEST_CHARS = 400_000
    private static final long MAX_BODY_BYTES = 1_000_000
    private static final int MAX_STREAMS_PER_USER = 2

    private static final String TOO_LARGE_MSG = 'This conversation is too large to send. Clear it to start again.'

    private static final String BUSY_MSG = 'The model is busy. Try again in a minute.'
    private static final String UNAVAILABLE_MSG = 'The model is not available right now. Try again in a few minutes.'
}
