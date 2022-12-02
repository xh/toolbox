import io.xh.hoist.configuration.LogbackConfig
import io.xh.toolbox.log.TokenizedExampleConverter

// Tokenized output to monitorLayout, overriding msg conversion from DefaultConverter
LogbackConfig.monitorLayout = '%d{HH:mm:ss.SSS} | %tokenizedMsg%n'

conversionRule("tokenizedMsg", TokenizedExampleConverter)

LogbackConfig.defaultConfig(this)
