package io.xh.toolbox

import io.xh.toolbox.log.CustomLogSupportConverter

/**
 * Example of deeply overriding format via custom converter.
 */
class LogbackConfig extends io.xh.hoist.LogbackConfig {

    String getMonitorLayout() {
        '%d{HH:mm:ss.SSS} | %customMsg%n'
    }

    void configureLogging() {
        conversionRule('customMsg', CustomLogSupportConverter)
        super.configureLogging()
    }
}
