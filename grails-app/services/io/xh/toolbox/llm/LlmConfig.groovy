package io.xh.toolbox.llm

import io.xh.hoist.config.TypedConfigMap

/**
 * Typed representation of the `llmConfig` soft config - settings for the LLM relay behind the Live
 * Model demo on the Chat Kit tab. The API key is kept apart, in the `llmApiKey` pwd config.
 *
 * Read server-side via `configService.getObject(LlmConfig)` by {@link LlmService}.
 */
class LlmConfig extends TypedConfigMap {

    /** Anthropic model ID used for every call. */
    String model = 'claude-sonnet-5-5'

    /** Max output tokens per model call. */
    Integer maxTokens = 8192

    /**
     * Max model calls per user per hour, across the cluster. A tool loop makes one call per step.
     * Members of `TOOLBOX_LLM_UNLIMITED` have no limit, and with 0 only they can make calls.
     */
    Integer rateLimit = 20

    /**
     * Max tokens per user per app day - input, output and cache reads and writes - or null for no
     * limit. Checked before each call, so the call that crosses it completes. Members of
     * `TOOLBOX_LLM_UNLIMITED` have no limit.
     */
    Long dailyTokenLimit = null

    /**
     * Max tokens per app day across all users, or null for no limit. Past it, only members of
     * `TOOLBOX_LLM_UNLIMITED` can make calls, though their tokens count toward it.
     */
    Long dailyTokenBudget = null

    /**
     * Max concurrent streams, per server instance. Each holds a request thread for its whole length.
     * A request beyond the limit fails at once with a "busy" message.
     */
    Integer maxStreams = 20

    /**
     * Other Anthropic Messages API params sent with every call, e.g.
     * `{"output_config": {"effort": "medium"}}` or
     * `{"thinking": {"type": "adaptive", "display": "summarized"}}`. The client cannot set these.
     * Sonnet 5.5 rejects sampling params, `budget_tokens` and disabled thinking.
     */
    Map requestParams = [:]

    /**
     * Anthropic server tool definitions added to every call, e.g.
     * `[{"type": "web_search_20260209", "name": "web_search", "max_uses": 3}]`. Server tools cost
     * extra, so the relay rejects any the client sends.
     */
    List<Map> serverTools = []

    LlmConfig(Map args) { init(args) }
}
