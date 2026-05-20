package io.xh.toolbox.log

import io.xh.hoist.log.LogSupportConverter

/**
 * Example layout converter that outputs log messages in a more structured "key=value" format
 * than the output used by Hoist's default {@link LogSupportConverter}.
 *
 * NOTE this is an example of an app-specific converter that could be used for any app- or
 * enterprise-specific logging needs. It is NOT necessary for a Hoist app that is happy with the
 * toolkit's default formatting.
 *
 * A customer converter such as this must be enabled in `LogBackConfig.groovy` by associating it
 * with a format string via `conversionRule` and then using that format string in a layout template.
 * See {@link io.xh.toolbox.LogbackConfig}.
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
