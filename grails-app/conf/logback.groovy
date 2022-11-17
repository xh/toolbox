import io.xh.hoist.configuration.LogbackConfig
import io.xh.toolbox.log.GrahamConverter

// GRAHAM CONVENTION to stdout
LogbackConfig.stdoutLayout = '%d{"yyyy-MM-dd\'T\'HH:mm:ss.SSSZ"}, class=%c{0}, level=%p, %GrahamMsg%n'

conversionRule("GrahamMsg", GrahamConverter)

LogbackConfig.defaultConfig(this)
