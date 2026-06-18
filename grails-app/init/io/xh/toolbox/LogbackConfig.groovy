package io.xh.toolbox

import io.xh.toolbox.log.CustomLogSupportConverter

/**
 * Example of deeply overriding format via custom converter.
 *
 * NOTE that apps that do not require custom logging formats must still include this class
 * to properly inherit the base Hoist logging configuration, but with an empty body (no overrides).
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
