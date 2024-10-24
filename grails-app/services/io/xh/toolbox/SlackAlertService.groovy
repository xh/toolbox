package io.xh.toolbox

import io.xh.hoist.BaseService
import io.xh.hoist.clienterror.ClientError
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONParser
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.monitor.MonitorStatusReport
import io.xh.hoist.util.StringUtils
import io.xh.hoist.util.Utils
import org.apache.hc.client5.http.classic.methods.HttpPost
import org.apache.hc.core5.http.io.entity.StringEntity

import static io.xh.hoist.monitor.MonitorStatus.*

class SlackAlertService extends BaseService {

    ConfigService configService

    void init() {
        subscribeToTopic(
                topic: 'xhMonitorStatusReport',
                onMessage: this.&formatAndSendMonitorStatusReport,
                primaryOnly: true

        )
        subscribeToTopic(
                topic: 'xhClientErrorReceived',
                onMessage: this.&formatAndSendClientReport,
                primaryOnly: true
        )
    }

    //------------------------
    // Implementation
    //------------------------
    private void formatAndSendMonitorStatusReport(MonitorStatusReport report) {
        if (!enabled) return

        sendSlackMessage("""
Monitor Status Report:
${report.title}
${alertSummary(report)}
        """)
    }

    private void formatAndSendClientReport(ClientError ce) {
        if (!enabled) return

        def errorText = safeParseJSON(ce.error)?.message ?: ce.error

        sendSlackMessage("""
Client Error Report:
Error: ${StringUtils.elide(errorText, 80)}
User: ${ce.username}
Version: ${ce.appVersion}
Environment: ${ce.appEnvironment}
Browser: ${ce.browser}
Device: ${ce.device}
URL: ${ce.url}
Time: ${ce.dateCreated.format('dd-MMM-yyyy HH:mm:ss')}
---------------------------------
        """)
    }

    private void sendSlackMessage(message) {
        def client = new JSONClient(),
            post = new HttpPost('https://slack.com/api/chat.postMessage'),
            body = JSONSerializer.serialize([channel: config.channel, text: message]),
            entity = new StringEntity(body)

        post.setHeader('Content-type', 'application/json')
        post.setHeader('Authorization', "Bearer ${config.oauthToken}")
        post.setEntity(entity)

        client.executeAsMap(post)
    }

    private Map safeParseJSON(String errorText) {
        try {
            return JSONParser.parseObject(errorText)
        } catch (Exception ignored) {
            return null
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
        return !Utils.isLocalDevelopment && config.enabled
    }

    private Map getConfig() {
        return configService.getMap('slackAlertConfig', [enabled: false])
    }

    Map getAdminStats() {
        [
                config: configForAdminStats('slackAlertConfig')
        ]
    }

}
