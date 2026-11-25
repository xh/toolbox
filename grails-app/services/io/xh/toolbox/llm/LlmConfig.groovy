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

    /**
     * Max output tokens per model call, sent as `max_tokens`. Thinking counts toward it. A reply
     * that reaches it stops, and the chat marks it as cut off. This caps a single reply, not
     * spend - each call is billed for the tokens it uses, and `rateLimit` bounds the calls.
     */
    Integer maxTokens = 32_000

    /**
     * Other Anthropic Messages API params sent with every call, e.g.
     * `{"output_config": {"effort": "low"}}`. The client cannot set these.
     */
    Map requestParams = [:]

    /**
     * Max model calls per user per hour, shared across the cluster. A tool loop makes one call per
     * step. Members of `ACCESS_LLM_FEATURES_UNLIMITED` have no limit, and with 0 only they can make
     * calls.
     */
    Integer rateLimit = 20

    /** Max streams one user may run at once, per server instance. */
    Integer maxStreamsPerUser = 2

    /**
     * Max concurrent streams, per server instance. Each holds a request thread for its whole length.
     * A request beyond the limit fails at once with a "busy" message.
     */
    Integer maxStreams = 20

    /** Max messages in a conversation. A longer one must be cleared to continue. */
    Integer maxMessages = 200

    /** Max size of a request body, in KB. A conversation that grows past it must be cleared. */
    Integer maxRequestKb = 400

    LlmConfig(Map args) { init(args) }
}
