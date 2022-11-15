import io.xh.hoist.configuration.LogbackConfig
import io.xh.toolbox.log.GrahamConverter

// https://logback.qos.ch/manual/groovy.html
// https://logback.qos.ch/manual/layouts.html#customConversionSpecifier
// https://logback.qos.ch/xref/chapters/layouts/MySampleConverter.html
// https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html

// GRAHAM CONVENTION to stdout
LogbackConfig.stdoutLayout = '%d{"yyyy-MM-dd\'T\'HH:mm:ss.SSSZ"}, class=%c{0}, level=%p, %GrahamMsg%n'

conversionRule("GrahamMsg", GrahamConverter)

LogbackConfig.defaultConfig(this)
