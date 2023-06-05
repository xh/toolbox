package io.xh.toolbox.log

import io.xh.hoist.log.LogSupportConverter

/**
 * Layout Converter to output log messages in a more strict key/value pair format than Hoist's default
 * `LogSupportConverter`
 *
 * This is an example of an application-specific converter that can be used for application or enterprise
 * specific logging needs. It should be enabled in `logback.groovy`, by associating it with a format string via
 * `conversionRule` and using that format string in any layout template.
 */
class CustomLogSupportConverter extends LogSupportConverter {


    protected String getDelimiter() {
        return ', '
    }

    protected String formatMap(Map mp) {
        return mp.collect { k, v ->
            v = v instanceof Throwable ? formatThrowable(v) : v.toString()
            k = k.toString().replaceAll(/^_/, '')
            return "$k=$v"
        }.join(delimiter)
    }
}
