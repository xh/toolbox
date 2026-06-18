package io.xh.toolbox

import grails.compiler.GrailsCompileStatic
import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.monitor.AggregateMonitorResult
import io.xh.hoist.monitor.MonitorStatusReport
import io.xh.hoist.track.TrackLog
import io.xh.hoist.util.Utils
import org.apache.hc.client5.http.classic.methods.HttpPost
import org.apache.hc.core5.http.io.entity.StringEntity

import static io.xh.hoist.monitor.MonitorStatus.*

/**
 * Posts notifications to Slack via the Slack Web API - Toolbox's reference example of an outbound
 * Slack integration. Subscribes to cluster topics for three event types - monitor status reports,
 * client error reports, and user feedback - rendering each as a Block Kit message.
 *
 * Posting is driven by the typed `slackAlertConfig` soft config: disabled by default and gated per
 * event type, requiring a Slack bot token and target channel. The bot must be a member of that
 * channel or posts are rejected.
 *
 * Topic subscriptions are `primaryOnly`, so only the primary instance posts - avoiding duplicate
 * messages when running as a multi-instance cluster.
 */
@GrailsCompileStatic
class SlackAlertService extends BaseService {

    String telemetryPrefix = 'toolbox.slack'

    ConfigService configService

    void init() {
        subscribeToTopic(
            topic: 'xhMonitorStatusReport',
            onMessage: this.&sendMonitorStatusReport,
            primaryOnly: true
        )
        subscribeToTopic(
            topic: 'xhTrackReceived',
            onMessage: { TrackLog tl ->
                if (tl.isClientError) sendClientErrorReport(tl)
                else if (tl.category == 'Feedback') sendFeedbackReport(tl)
            },
            primaryOnly: true
        )
    }


    //------------------------
    // Status Monitors
    //------------------------
    private void sendMonitorStatusReport(MonitorStatusReport report) {
        if (!enabled || !config.monitorAlertsEnabled) return
        sendSlackMessage(config.channel, 'monitor status report', "Monitor Status Report: ${report.title}", monitorBlocks(report))
    }

    private List monitorBlocks(MonitorStatusReport report) {
        List<Map> blocks = [
            [type: 'header', text: [type: 'plain_text', text: 'Monitor Status Report', emoji: true]],
            [type: 'section', text: [type: 'mrkdwn', text: "*${report.title}*".toString()]]
        ]

        // Group failing / warning monitors under a labeled heading rather than tagging every line -
        // the heading carries the status, so a per-line indicator would just be noise.
        Map failures = monitorGroupBlock(':small_red_triangle_down:', 'Failures', report.results.findAll { it.status == FAIL }),
            warnings = monitorGroupBlock(':small_orange_diamond:', 'Warnings', report.results.findAll { it.status == WARN })
        if (failures) blocks << failures
        if (warnings) blocks << warnings

        blocks << [type: 'context', elements: [[type: 'mrkdwn', text: serverMeta()]]]
        return blocks
    }

    private Map monitorGroupBlock(String emoji, String label, List<AggregateMonitorResult> results) {
        if (!results) return null
        List<String> lines = results.collect { AggregateMonitorResult r ->
            String line = "• *${r.name}*"
            if (r.message) line += " - ${r.message}"
            return line
        }
        return [type: 'section', text: [type: 'mrkdwn', text: "${emoji} *${label}*\n${lines.join('\n')}".toString()]]
    }


    //------------------------
    // Client Errors
    //------------------------
    private void sendClientErrorReport(TrackLog tl) {
        if (!enabled || !config.clientErrorsEnabled) return
        sendSlackMessage(config.channel, 'client error', "Client Error from ${tl.username}: ${tl.errorSummary}", clientErrorBlocks(tl))
    }

    private List clientErrorBlocks(TrackLog tl) {
        Map data = tl.dataAsObject ?: [:]
        Map error = (data['error'] ?: [:]) as Map
        String detail = stackText(error['stack']) ?: error['message'] as String

        List<Map> blocks = [
            [type: 'header', text: [type: 'plain_text', text: "Client Error: ${tl.username}".toString()]],
            [type: 'section', text: [type: 'mrkdwn', text: ":rotating_light: *${tl.errorSummary ?: 'Client Error'}*".toString()]]
        ]

        // Context message that accompanied the error, when it adds something beyond the summary.
        if (tl.msg && tl.msg != tl.errorSummary) {
            blocks << [type: 'section', text: [type: 'mrkdwn', text: "_${tl.msg}_".toString()]]
        }
        // Full stack (or message) in a code block for debugging.
        if (detail) {
            blocks << [type: 'section', text: [type: 'mrkdwn', text: "```\n${truncate(detail)}\n```".toString()]]
        }
        if (tl.url) blocks << [type: 'section', text: [type: 'mrkdwn', text: "*URL:* ${tl.url}".toString()]]
        blocks << [type: 'context', elements: [[type: 'mrkdwn', text: clientMeta(tl)]]]
        return blocks
    }

    /**
     * Reconstruct a newline-delimited stack trace from a client error's serialized `stack`. Hoist's
     * client splits the stack on newlines, which arrives here index-keyed (a Map of `0,1,2...` ->
     * line, or a List), so we re-join on `\n` to render real line breaks in the Slack code block.
     */
    private String stackText(Object stack) {
        if (stack instanceof Map) return ((Map) stack).values().join('\n')
        if (stack instanceof Collection) return ((Collection) stack).join('\n')
        return stack as String
    }


    //------------------------
    // Hoist Feedback
    //------------------------
    private void sendFeedbackReport(TrackLog tl) {
        if (!enabled || !config.feedbackEnabled) return

        Map data = tl.dataAsObject ?: [:]
        String rating = data['rating'] as String,
               userMessage = data['userMessage'] as String,
               channel = config.feedbackChannel ?: config.channel

        sendSlackMessage(channel, 'user feedback', feedbackFallbackText(tl, rating, userMessage), feedbackBlocks(tl, rating, userMessage))
    }

    private List feedbackBlocks(TrackLog tl, String rating, String userMessage) {
        List<Map> blocks = [
            [type: 'header', text: [type: 'plain_text', text: "User Feedback: ${tl.username}".toString()]]
        ]
        // Sentiment comes only from the home-page widget; Hoist's built-in feedback dialog has
        // none, so omit the line entirely rather than rendering an empty "n/a" rating.
        if (rating) {
            blocks << [type: 'section', text: [type: 'mrkdwn', text: "${ratingEmoji(rating)} ${rating}".toString()]]
        }
        if (userMessage) {
            String quoted = userMessage.replaceAll('\n', '\n> ')
            blocks << [type: 'section', text: [type: 'mrkdwn', text: "> ${quoted}".toString()]]
        }
        blocks << [type: 'context', elements: [[type: 'mrkdwn', text: clientMeta(tl)]]]
        return blocks
    }

    private String feedbackFallbackText(TrackLog tl, String rating, String userMessage) {
        List parts = ["User Feedback from ${tl.username}"]
        if (rating) parts << "(${rating})"
        if (userMessage) parts << "- ${userMessage}"
        return parts.join(' ')
    }

    private String ratingEmoji(String rating) {
        switch (rating) {
            case 'positive': return ':smiley:'
            case 'neutral': return ':neutral_face:'
            case 'negative': return ':slightly_frowning_face:'
            default: return ':grey_question:'
        }
    }


    //------------------------
    // Other Implementation
    //------------------------
    private String clientMeta(TrackLog tl) {
        return [
            "*Version:* ${tl.appVersion}",
            "*Env:* ${tl.appEnvironment}",
            "*Browser:* ${tl.browser}",
            "*Device:* ${tl.device}",
            "*Tab:* ${tl.tabId}"
        ].join('  |  ')
    }

    /** Footer for server-originated alerts (no client/user context) - the app version + environment. */
    private String serverMeta() {
        return [
            "*Version:* ${Utils.appVersion}",
            "*Env:* ${Utils.appEnvironment}"
        ].join('  |  ')
    }

    private void sendSlackMessage(String channel, String description, String text, List blocks = null) {
        if (!channel) {
            logWarn("Cannot post ${description} to Slack - no channel configured")
            return
        }
        try {
            // Observe the send with a span plus a counter - the counter auto-prefixes with our
            // `telemetryPrefix` (-> `toolbox.slack.messagesSent`) and is tagged by message `type`
            // and an `xh.outcome` (success/failure) the framework derives from whether we throw.
            span('sendMessage')
                .counter(name: 'messagesSent', tags: [type: description])
                .run {
                    JSONClient client = new JSONClient()
                    HttpPost post = new HttpPost('https://slack.com/api/chat.postMessage')
                    Map<String, Object> payload = [channel: channel, text: text]
                    if (blocks) payload['blocks'] = blocks

                    post.setHeader('Content-type', 'application/json')
                    post.setHeader('Authorization', "Bearer ${config.oauthToken}")
                    post.setEntity(new StringEntity(JSONSerializer.serialize(payload)))

                    // Slack signals logical failures (bad token, bot not in channel, etc.) as an
                    // HTTP 200 with `{ok: false, error: ...}`, so check the body, not just the
                    // status. Throw so the observed run marks a failed span + counter outcome.
                    Map resp = client.executeAsMap(post)
                    if (resp?.get('ok') != true) {
                        throw new RuntimeException("Slack API error: ${resp?.get('error')}")
                    }
                }
            logInfo("Posted ${description} to Slack", [channel: channel])
        } catch (Exception e) {
            // Catch locally to keep our structured log (vs. the topic handler's generic message)
            // and to handle transport + logical failures uniformly - both counted, both logged.
            logError("Failed to post ${description} to Slack", [channel: channel], e)
        }
    }

    private String truncate(String text, int maxLength = 2800) {
        return text.length() > maxLength ? text.take(maxLength) + '\n... (truncated)' : text
    }

    private boolean getEnabled() {
        return config.enabled && config.oauthToken
    }

    private SlackAlertConfig getConfig() {
        return configService.getObject(SlackAlertConfig)
    }

    Map getAdminStats() {
        return [config: configForAdminStats('slackAlertConfig')]
    }

}
