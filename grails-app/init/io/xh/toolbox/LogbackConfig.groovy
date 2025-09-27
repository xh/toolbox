package io.xh.toolbox

import io.xh.toolbox.log.CustomLogSupportConverter

class LogbackConfig extends io.xh.hoist.LogbackConfig {

    void configureLogging() {

        // Example deeply overriding format via custom converter.
        LogbackConfig.monitorLayout = '%d{HH:mm:ss.SSS} | %customMsg%n'
        conversionRule('customMsg', CustomLogSupportConverter)

        super.configureLogging()
    }
}
