package io.xh.toolbox.app

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

import static io.xh.hoist.util.Utils.getAppName

class SlackAlertService extends BaseService{

    ConfigService configService
    void init() {
        subscribe('xhMonitorStatusReport', this.&sendMonitorStatusReport)
        subscribe('xhClientErrorReceived', this.&formatAndSendClientReport)
    }


    //------------------------
    // Implementation
    //------------------------
    private void sendMonitorStatusReport(MonitorStatusReport report) {
        sendToolboxAlertMessage(report.getTitle())
    }

    private void formatAndSendClientReport(ClientError ce){
        def errorText = safeParseJSON(ce.error)?.message ?: ce.error

        def msg =  "Error: ${StringUtils.elide(errorText,80)} \n" +
                "User: ${ce.username}\n"  +
                "App: ${appName} (${Utils.appCode})\n" +
                "Version: ${ce.appVersion}\n" +
                "Environment: ${ce.appEnvironment}\n" +
                "Browser: ${ce.browser}\n" +
                "Device: ${ce.device}\n" +
                "URL: ${ce.url}\n" +
                "Time: ${ce.dateCreated.format('dd-MMM-yyyy HH:mm:ss')}"
        sendToolboxAlertMessage(msg)
    }

    def sendToolboxAlertMessage(message){
        def client = new JSONClient()
        def channelId = configService.getString('slackChannelId')
        def post = new HttpPost('https://slack.com/api/chat.postMessage'),
            body = JSONSerializer.serialize([channel: channelId,text: message])

        def entity = new StringEntity(body)
        post.setHeader('Content-type', 'application/json')
        post.setHeader('Accept', 'application/json')
        post.setHeader('Authorization', "Bearer ${configService.getString('slackBearerToken')}")
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
}
