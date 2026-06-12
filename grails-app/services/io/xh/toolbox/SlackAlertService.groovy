package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.monitor.MonitorStatusReport
import io.xh.hoist.track.TrackLog
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
