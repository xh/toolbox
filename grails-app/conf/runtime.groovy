import io.xh.hoist.configuration.RuntimeConfig
import io.xh.toolbox.DBConfig

import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig


RuntimeConfig.defaultConfig(this)
DBConfig.dataSourceConfig(this)



//---------------------
// Mail - configures SMTP connection if outbound emailing capabilities required.
// Customize as needed for deployment environment - the below works for Toolbox's AWS deployment.
//---------------------
grails {
    mail {
        host = getInstanceConfig('smtpHost')
        port = 465
        username = getInstanceConfig('smtpUser')
        password = getInstanceConfig('smtpPassword')
        props = [
            'mail.smtp.auth': 'true',
            'mail.smtp.socketFactory.port': '465',
            'mail.smtp.socketFactory.class': 'javax.net.ssl.SSLSocketFactory',
            'mail.smtp.socketFactory.fallback': 'false'
        ]
    }
}
