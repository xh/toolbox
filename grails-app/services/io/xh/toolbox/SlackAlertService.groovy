package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.monitor.MonitorStatusReport
import io.xh.hoist.track.TrackLog
import io.xh.hoist.util.Utils
import org.apache.hc.client5.http.classic.methods.HttpPost
import org.apache.hc.core5.http.io.entity.StringEntity

import static io.xh.hoist.monitor.MonitorStatus.*

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
            onMessage: {TrackLog tl ->
                if (tl.isClientError) sendClientErrorReport(tl)
                else if (tl.category == 'Feedback') sendFeedbackReport(tl)
            },
            primaryOnly: true
        )
    }

    //------------------------
    // Implementation
    //------------------------
    private void sendMonitorStatusReport(MonitorStatusReport report) {
        if (!enabled || !config.monitorAlertsEnabled) return

        sendSlackMessage(config.channel, """
Monitor Status Report:
${report.title}
${alertSummary(report)}
        """)
    }

    private void sendClientErrorReport(TrackLog tl) {
        if (!enabled || !config.clientErrorsEnabled) return

        sendSlackMessage(config.channel, """
Client Error Report:
Error: ${tl.errorSummary}
User: ${tl.username}
Version: ${tl.appVersion}
Environment: ${tl.appEnvironment}
Browser: ${tl.browser}
Device: ${tl.device}
URL: ${tl.url}
Time: ${tl.dateCreated.format('dd-MMM-yyyy HH:mm:ss')}
---------------------------------
        """)
    }

    private void sendFeedbackReport(TrackLog tl) {
        if (!enabled || !config.feedbackEnabled) return

        def data = tl.dataAsObject ?: [:],
            rating = data.rating as String,
            userMessage = data.userMessage as String,
            channel = config.feedbackChannel ?: config.channel

        if (!channel) {
            logWarn('Feedback received but no Slack channel configured', [user: tl.username])
            return
        }

        sendSlackMessage(channel, feedbackFallbackText(tl, rating, userMessage), feedbackBlocks(tl, rating, userMessage))
    }

    private List feedbackBlocks(TrackLog tl, String rating, String userMessage) {
        def blocks = [
            [type: 'header', text: [type: 'plain_text', text: ':speech_balloon: User Feedback', emoji: true]],
            [type: 'section', text: [type: 'mrkdwn', text: "*Sentiment:* ${ratingEmoji(rating)} ${rating ?: 'n/a'}".toString()]]
        ]
        if (userMessage) {
            def quoted = userMessage.replaceAll('\n', '\n> ')
            blocks << [type: 'section', text: [type: 'mrkdwn', text: "> ${quoted}".toString()]]
        }
        blocks << [type: 'context', elements: [[type: 'mrkdwn', text: feedbackMeta(tl)]]]
        return blocks
    }

    private String ratingEmoji(String rating) {
        switch (rating) {
            case 'positive': return ':smiley:'
            case 'neutral':  return ':neutral_face:'
            case 'negative': return ':slightly_frowning_face:'
            default:         return ':grey_question:'
        }
    }

    private String feedbackMeta(TrackLog tl) {
        [
            "*User:* ${tl.username}",
            "*App:* ${Utils.appName} (${Utils.appCode})",
            "*Version:* ${tl.appVersion}",
            "*Env:* ${tl.appEnvironment}",
            "*Browser:* ${tl.browser}",
            "*Device:* ${tl.device}",
            "*Submitted:* ${tl.dateCreated.format('dd-MMM-yyyy HH:mm:ss')}"
        ].join('  |  ').toString()
    }

    private String feedbackFallbackText(TrackLog tl, String rating, String userMessage) {
        def parts = ["User Feedback from ${tl.username}"]
        if (rating) parts << "(${rating})"
        if (userMessage) parts << "- ${userMessage}"
        return parts.join(' ').toString()
    }

    private void sendSlackMessage(String channel, String text, List blocks = null) {
        span('sendMessage').run {
            def client = new JSONClient(),
                post = new HttpPost('https://slack.com/api/chat.postMessage'),
                payload = [channel: channel, text: text]
            if (blocks) payload.blocks = blocks

            def entity = new StringEntity(JSONSerializer.serialize(payload))
            post.setHeader('Content-type', 'application/json')
            post.setHeader('Authorization', "Bearer ${config.oauthToken}")
            post.setEntity(entity)

            client.executeAsMap(post)
        }
    }

    private String alertSummary(MonitorStatusReport report) {
        if (report.status == OK) return ''
        def failSummary = report.results.findAll { it.status == FAIL }.collect { "-$it.name -- $it.message" }
        def warnSummary = report.results.findAll { it.status == WARN }.collect { "-$it.name -- $it.message" }
        def msg = []
        msg << '-------------Summary-------------'
        if (failSummary) {
            msg << 'Failed: '
            msg.addAll(failSummary)
        }
        if (warnSummary) {
            msg << 'Warned: '
            msg.addAll(warnSummary)
        }
        msg << '---------------------------------'
        msg.join('\n') + '\n'
    }

    private boolean getEnabled() {
        return config.enabled && config.oauthToken
    }

    private SlackAlertConfig getConfig() {
        return configService.getObject(SlackAlertConfig)
    }

    Map getAdminStats() {
        [
                config: configForAdminStats('slackAlertConfig')
        ]
    }

}
