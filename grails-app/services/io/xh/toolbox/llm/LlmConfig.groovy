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
    String model = 'claude-sonnet-4-6'

    /** Max output tokens per model call. */
    Integer maxTokens = 8192

    /**
     * Max model calls per user per hour, per server instance. A tool loop makes one call per step.
     * Members of `TOOLBOX_LLM_UNLIMITED` have no limit, and with 0 only they can make calls.
     */
    Integer rateLimit = 20

    /**
     * Max concurrent streams, per server instance. Each holds a request thread for its whole length.
     * A request beyond the limit fails at once with a "busy" message.
     */
    Integer maxStreams = 20

    /**
     * Other Anthropic Messages API params sent with every call, e.g. `{"temperature": 0.5}` or
     * `{"thinking": {"type": "enabled", "budget_tokens": 4000}}`. The client cannot set these.
     */
    Map requestParams = [:]

    /**
     * Anthropic server tool definitions added to every call, e.g.
     * `[{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}]`. Server tools cost
     * extra, so the relay rejects any the client sends.
     */
    List<Map> serverTools = []

    LlmConfig(Map args) { init(args) }
}
