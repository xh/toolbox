package io.xh.toolbox

import io.xh.hoist.config.TypedConfigMap

/**
 * Typed representation of the `slackAlertConfig` soft config, controlling Slack notifications for
 * monitor status reports, client-error reports, and user feedback.
 *
 * Everything is disabled by default: set `enabled` plus the relevant per-type flag(s) and target
 * channel(s) to begin posting. This is Toolbox's reference example of hoist-core's `TypedConfigMap`
 * typed soft-config feature - read via `configService.getObject(SlackAlertConfig)`.
 */
class SlackAlertConfig extends TypedConfigMap {

    /** Master switch - when false (the default), the service posts nothing at all. */
    boolean enabled = false

    /** Slack bot OAuth token (xoxb-...). Required for any posting. */
    String oauthToken = null

    /** Channel for monitor status + client-error alerts (e.g. '#toolbox-alerts'). */
    String channel = null

    /** Optional separate channel for user feedback; falls back to `channel` when blank. */
    String feedbackChannel = null

    /** Post monitor status reports (gated under `enabled`). */
    boolean monitorAlertsEnabled = false

    /** Post client-error reports (gated under `enabled`). */
    boolean clientErrorsEnabled = false

    /** Post user feedback (gated under `enabled`). */
    boolean feedbackEnabled = false

    SlackAlertConfig(Map args) { init(args) }
}
