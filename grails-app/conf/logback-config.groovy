import io.xh.toolbox.log.*
import io.xh.hoist.configuration.*

// Example deeply overriding format via custom converter.
LogbackConfig.monitorLayout = '%d{HH:mm:ss.SSS} | %customMsg%n'
conversionRule('customMsg', CustomLogSupportConverter)

LogbackConfig.defaultConfig(this)
