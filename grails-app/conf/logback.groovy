import io.xh.hoist.configuration.LogbackConfig
import io.xh.toolbox.log.MachineReadableConverter

// Machine Readable to stdout
LogbackConfig.stdoutLayout = '%d{"yyyy-MM-dd\'T\'HH:mm:ss.SSSZ"}, class=%c{0}, level=%p, %mrMsg%n'

conversionRule("mrMsg", MachineReadableConverter)

LogbackConfig.defaultConfig(this)
